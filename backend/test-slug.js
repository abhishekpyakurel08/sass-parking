const name = "Abhishek";
let tenantSlug = null;
if (!tenantSlug && name) {
  tenantSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
console.log("tenantSlug is:", tenantSlug);
