export type ShipmentItem={productId:number;quantity:number};

export function isValidShipmentItems(value:unknown):value is ShipmentItem[]{
 return Array.isArray(value)&&value.length>0&&value.every(item=>
  typeof item==="object"&&item!==null&&
  Number.isInteger((item as ShipmentItem).productId)&&
  Number.isInteger((item as ShipmentItem).quantity)&&
  (item as ShipmentItem).quantity>0
 );
}
