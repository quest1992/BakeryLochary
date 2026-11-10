import assert from "node:assert/strict";
import test from "node:test";
import {execFileSync} from "node:child_process";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {PrismaClient} from "@prisma/client";
import {editProduction, productionDefectNote, productionUseNote} from "./edit-production";

test("edits legacy production using actual consumption and keeps the original defect count", async () => {
  const dir = mkdtempSync(join(tmpdir(), "lochari-edit-production-"));
  const file = join(dir, "test.db");
  writeFileSync(file, "");
  const url = "file:" + file.replaceAll("\\", "/");
  const db = new PrismaClient({datasourceUrl:url});
  try {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"], {
      env:{...process.env, DATABASE_URL:url}, stdio:"pipe",
    });
    const user = await db.user.create({data:{name:"Owner", username:"owner", passwordHash:"unused", role:"OWNER"}});
    const product = await db.product.create({data:{name:"Pizza", sku:"P", price:10, stock:{create:{quantity:20}}}});
    const ingredient = await db.ingredient.create({data:{name:"Flour", unit:"G", stock:100}});
    await db.recipeItem.create({data:{productId:product.id, ingredientId:ingredient.id, quantity:9}});
    const producedAt = new Date("2026-11-09T13:55:01.636Z");
    const usage = await db.ingredientMovement.create({data:{
      ingredientId:ingredient.id, type:"PRODUCTION_USE", quantity:-112, note:"Партия Pizza", createdAt:new Date(+producedAt - 5),
    }});
    const batch = await db.productionBatch.create({data:{productId:product.id, userId:user.id, quantity:56, producedAt}});
    const defect = await db.productMovement.create({data:{
      productId:product.id, userId:user.id, type:"WRITE_OFF", quantity:-2, note:"Брак при производстве", createdAt:new Date(+producedAt + 5),
    }});
    const edit = (quantity:number, note:string, original:number, originalNote="") =>
      db.$transaction(tx => editProduction(tx, batch.id, quantity, note, original, originalNote));

    await assert.rejects(edit(30, "", 56), /На складе недостаточно/);
    await edit(46, "Уточнение", 56);
    assert.equal((await db.ingredient.findUniqueOrThrow({where:{id:ingredient.id}})).stock, 120);
    const linkedUsage = await db.ingredientMovement.findUniqueOrThrow({where:{id:usage.id}});
    assert.equal(linkedUsage.quantity, -92);
    assert.equal(linkedUsage.note, productionUseNote(batch.id) + product.name);
    assert.equal(+linkedUsage.createdAt, +usage.createdAt);
    const linkedDefect = await db.productMovement.findUniqueOrThrow({where:{id:defect.id}});
    assert.equal(linkedDefect.quantity, -2);
    assert.equal(linkedDefect.note, productionDefectNote(batch.id));
    await assert.rejects(edit(46, "Уточнение", 56), /уже изменена/);
    await db.product.update({where:{id:product.id}, data:{name:"Renamed"}});
    await edit(48, "Проверено", 46, "Уточнение");
    const saved = await db.productionBatch.findUniqueOrThrow({where:{id:batch.id}});
    assert.equal(saved.quantity, 48);
    assert.equal(saved.note, "Проверено");
    assert.equal((await db.productStock.findUniqueOrThrow({where:{productId:product.id}})).quantity, 12);
    assert.equal((await db.ingredient.findUniqueOrThrow({where:{id:ingredient.id}})).stock, 116);
  } finally {
    await db.$disconnect();
    rmSync(dir, {recursive:true, force:true});
  }
});
