console.log("🔧 [Add-Item-Count] Module loaded.");

Hooks.once("ready", () => {
  console.log("✅ [Add-Item-Count] Hooks ready. System:", game.system.id, "Version:", game.system.version);

  // Patch the grant function to apply quantity on item creation
  const originalGrant = CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant;

  CONFIG.DND5E.AdvancementTypes.ItemGrant.prototype._grant = async function (actor, advancement, data = {}) {
    console.log("🟨 [Add-Item-Count] Grant function called.");
    const granted = [];
    const config = advancement.system.config || {};
    const items = config.items || [];
    const quantities = config.quantities || {};

    for (let uuid of items) {
      const item = await fromUuid(uuid);
      if (!item) {
        console.warn("⚠️ [Add-Item-Count] Could not resolve item from UUID:", uuid);
        continue;
      }

      const quantity = Math.max(parseInt(quantities[uuid] || 1), 1);
      const itemData = item.toObject();

      if (itemData.system?.quantity !== undefined) {
        console.log(`🔢 [Add-Item-Count] Setting quantity ${quantity} for item:`, itemData.name);
        itemData.system.quantity = quantity;
      } else {
        console.warn(`⚠️ [Add-Item-Count] Item has no 'system.quantity' field:`, itemData.name);
      }

      granted.push(itemData);
    }

    return actor.createEmbeddedDocuments("Item", granted);
  };
});

Hooks.on("renderAdvancementConfig", (app, html, data) => {
  console.log("🧩 [Add-Item-Count] renderAdvancementConfig triggered.");
  const advancement = app.document;
  if (!advancement) {
    console.warn("⛔ [Add-Item-Count] No advancement document found.");
    return;
  }

  console.log("📄 [Add-Item-Count] Advancement type:", advancement.system.type);

  if (advancement.system.type !== "ItemGrant") {
    console.log("🚫 [Add-Item-Count] Not an ItemGrant advancement. Skipping.");
    return;
  }

  const config = advancement.system.config || {};
  const items = config.items || [];
  const quantities = config.quantities || {};
  console.log("📦 [Add-Item-Count] Items detected:", items.length);
  console.log("📦 [Add-Item-Count] Current quantities config:", quantities);

  const itemElements = html.find(".advancement-config__items .advancement-config__item");
  console.log("🔍 [Add-Item-Count] Found item DOM elements:", itemElements.length);

  if (!itemElements.length) {
    console.warn("⚠️ [Add-Item-Count] No matching DOM elements found. UI may have changed.");
  }

  itemElements.each((i, el) => {
    const uuid = items[i];
    if (!uuid) {
      console.warn(`⚠️ [Add-Item-Count] No UUID for item index ${i}`);
      return;
    }

    console.log(`📦 [Add-Item-Count] Injecting quantity input for item ${uuid}`);
    const field = document.createElement("input");
    field.type = "number";
    field.min = "1";
    field.classList.add("item-quantity-input");
    field.value = quantities[uuid] ?? 1;

    field.style.marginLeft = "0.5em";
    field.style.width = "4em";

    field.addEventListener("change", event => {
      const value = Math.max(parseInt(event.target.value), 1);
      console.log(`✏️ [Add-Item-Count] Quantity changed to ${value} for ${uuid}`);
      advancement.update({
        [`system.config.quantities.${uuid}`]: value
      });
    });

    el.appendChild(field);
  });
});
