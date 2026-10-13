export function defaultPrinter<T>(ports:T[],enabled:boolean):T|undefined {
 // Never silently choose between multiple granted devices.
 return enabled&&ports.length===1?ports[0]:undefined;
}
