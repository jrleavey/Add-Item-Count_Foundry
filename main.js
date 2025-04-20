ui.notifications.error("[Add-Item-Count] Quantity Editor Module Loaded!");

Hooks.once("ready", () => {
  console.log("✅ [Add-Item-Count] Module active");

  // Patch the actual grant logic
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

// Add the "Edit Quantities" button
Hooks.on("renderAdvancementConfig", (app, html, data) => {
  const advancement = app.object;
  if (!advancement || advancement.type !== "ItemGrant") return;

  const config = advancement.config || {};
  const items = config.items || [];
  const quantities = config.quantities || {};

  // Inject the Edit Quantities button below the Items field
  const itemsField = html.find('[name="config.items"]');
  if (!itemsField.length) return;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "⚙️ Edit Quantities";
  button.style.marginTop = "0.5em";

  button.addEventListener("click", () => {
    const list = items.map(uuid => {
      const name = fromUuidSync(uuid)?.name || uuid;
      const qty = quantities[uuid] ?? 1;
      return { uuid, name, qty };
    });

    const content = document.createElement("div");
    list.forEach(({ uuid, name, qty }) => {
      const row = document.createElement("div");
      row.style.margin = "0.5em 0";
      row.innerHTML = `
        <label style="width: 60%; display: inline-block;">${name}</label>
        <input type="number" data-uuid="${uuid}" value="${qty}" min="1" style="width: 4em;">
      `;
      content.appendChild(row);
    });

    new Dialog({
      title: "Set Item Quantities",
      content,
      buttons: {
        save: {
          label: "Save",
          callback: () => {
            const updates = {};
            content.querySelectorAll("input").forEach(input => {
              const uuid = input.dataset.uuid;
              const val = Math.max(parseInt(input.value), 1);
              updates[`config.quantities.${uuid}`] = val;
            });
            advancement.updateSource(updates);
            ui.notifications.info("✅ Quantities updated.");
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "save"
    }).render(true);
  });

  // Append after the item field's parent div
  itemsField.closest(".form-group")?.append(button);
});
