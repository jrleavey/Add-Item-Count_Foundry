// Inject a quantity input next to each item in the Grant Items screen
Hooks.on("renderAdvancementConfig", (app, html, data) => {
  const advancement = app.document;

  // Only modify for Grant Item advancements
  if (advancement.system.type !== "ItemGrant") return;

  // Get config object
  const config = advancement.system.config || {};
  const items = config.items || [];

  // For each item, inject a quantity input field
  html.find(".advancement-config__items .advancement-config__item").each((i, el) => {
    const uuid = items[i];
    if (!uuid) return;

    // Create quantity field
    const field = document.createElement("input");
    field.type = "number";
    field.min = "1";
    field.classList.add("item-quantity-input");
    field.value = config.quantities?.[uuid] ?? 1;

    // Style it a bit
    field.style.marginLeft = "0.5em";
    field.style.width = "4em";

    // Hook into changes and save to advancement config
    field.addEventListener("change", event => {
      const value = Math.max(parseInt(event.target.value), 1);
      advancement.update({
        [`system.config.quantities.${uuid}`]: value
      });
    });

    el.appendChild(field);
  });
});

// Patch the grant method to apply quantity properly
Hooks.once("ready", () => {
  const originalGrant = CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant;

  CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant = async function (actor, advancement, data = {}) {
    const granted = [];
    const config = advancement.config || {};
    const items = config.items || [];
    const quantities = config.quantities || {};

    for (let uuid of items) {
      const item = await fromUuid(uuid);
      if (!item) continue;

      const quantity = Math.max(parseInt(quantities[uuid] ?? 1), 1);

      const itemData = item.toObject();
      if (itemData.system?.quantity !== undefined) {
        itemData.system.quantity = quantity;
      }

      granted.push(itemData);
    }

    return actor.createEmbeddedDocuments("Item", granted);
  };
});
