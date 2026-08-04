"use client";
import {Trash2} from "lucide-react";
import {deleteRecipeItemAction} from "@/app/actions";

export default function DeleteRecipeItem({id,name}:{id:number;name:string}){
 return <form action={deleteRecipeItemAction} className="recipeDeleteForm" onSubmit={e=>{if(!confirm(`Удалить «${name}» из рецепта?`))e.preventDefault()}}>
  <input type="hidden" name="id" value={id}/>
  <button type="submit" className="recipeDeleteButton" title="Удалить из рецепта"><Trash2 size={14}/><span>Удалить</span></button>
 </form>;
}
