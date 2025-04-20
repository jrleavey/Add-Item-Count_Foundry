Hooks.on("renderItemGrantConfig", (app, html, data) => {
  const config = app.object?.config || {};
  const quantity = config.quantity ?? 1;

  const quantityInput = $(`
    <div class="form-group">
      <label>Quantity</label>
      <input type="number" name="config.quantity" value="${quantity}" min="1" />
    </div>
  `);

  html.find(".form-group").last().after(quantityInput);
});

Hooks.once("ready", () => {
  const originalGrant = CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant;

  CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant = async function (actor, advancement, data) {
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
