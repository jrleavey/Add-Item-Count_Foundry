ui.notifications.error("[Add-Item-Count] Module loaded and active!");

console.log("🔧 [Add-Item-Count] Module loaded.");

Hooks.once("ready", () => {
  console.log("✅ [Add-Item-Count] Ready. DnD5e Quantity Patch Live");

  const originalGrant = CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant;

  CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant = async function (actor, advancement, data = {}) {
    const granted = [];
    const config = advancement.config || {};
    const items = config.items || [];
    const quantities = config.quantities || {};

    for (let uuid of items) {
      const item = await fromUuid(uuid);
      if (!item) continue;

      const quantity = Math.max(parseInt(quantities[uuid] || 1), 1);
      const itemData = item.toObject();

      if (itemData.system?.quantity !== undefined) {
        itemData.system.quantity = quantity;
      }

      granted.push(itemData);
    }

    return actor.createEmbeddedDocuments("Item", granted);
  };
});

Hooks.on("renderAdvancementConfig", (app, html, data) => {
  const advancement = app.object;
  if (!advancement) return;

  if (advancement.type !== "ItemGrant") return;

  const config = advancement.config || {};
  const items = config.items || [];
  const quantities = config.quantities || {};

  console.log("📦 [Add-Item-Count] Found", items.length, "items.");
  const itemElements = html.find(".advancement-config__items .advancement-config__item");
  console.log("🎯 Matching DOM items:", itemElements.length);

  itemElements.each((i, el) => {
    const uuid = items[i];
    if (!uuid) return;

    const field = document.createElement("input");
    field.type = "number";
    field.min = "1";
    field.classList.add("item-quantity-input");
    field.value = quantities[uuid] ?? 1;

    field.style.marginLeft = "0.5em";
    field.style.width = "4em";

    field.addEventListener("change", event => {
      const value = Math.max(parseInt(event.target.value), 1);
      console.log(`✏️ [Add-Item-Count] Set quantity = ${value} for item ${uuid}`);

      advancement.updateSource({
        config: {
          ...advancement.config,
          quantities: {
            ...advancement.config.quantities,
            [uuid]: value
          }
        }
      });

      // Optional visual feedback
      field.style.border = "2px solid orange";
    });

    el.appendChild(field);
  });
});
