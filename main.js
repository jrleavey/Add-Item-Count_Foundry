Hooks.on("dnd5e.preAdvancementItemConfig", (app, html, config) => {
  if (config.type !== "ItemGrant") return;

  // Add quantity field to the form
  const qty = config.quantity ?? 1;

  const field = document.createElement("div");
  field.classList.add("form-group");
  field.innerHTML = `
    <label>Quantity</label>
    <input type="number" name="quantity" value="${qty}" min="1"/>
  `;

  html.querySelector("form").appendChild(field);
});

// Monkey patch the item grant apply logic
Hooks.once("ready", () => {
  const grant = CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant;

  CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant = async function (actor, advancement, data = {}) {
    const granted = [];
    const quantity = advancement.config.quantity ?? 1;

    for (let uuid of advancement.config.items) {
      const item = await fromUuid(uuid);
      if (!item) continue;

      const itemData = item.toObject();
      if (itemData.system?.quantity !== undefined) {
        itemData.system.quantity = quantity;
      }

      granted.push(itemData);
    }

    return actor.createEmbeddedDocuments("Item", granted);
  };
});
