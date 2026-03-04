export default function DrugItemRow({ item, index, onChange, onRemove, onCheckStock }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr auto auto", gap: 8, marginTop: 10 }}>
      <input value={item.drugLabel} disabled />

      <input
        value={item.dosage}
        placeholder="Dosage (e.g., 1 tab BD)"
        onChange={(e) => onChange(index, { ...item, dosage: e.target.value })}
      />

      <input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) => onChange(index, { ...item, quantity: Number(e.target.value) })}
      />

      <input
        value={item.instructions}
        placeholder="Instructions"
        onChange={(e) => onChange(index, { ...item, instructions: e.target.value })}
      />

      <button onClick={() => onCheckStock(index)}>Stock</button>
      <button onClick={() => onRemove(index)}>Remove</button>

      {item.availableQty !== null && (
        <div style={{ gridColumn: "1 / -1", marginTop: 6, opacity: 0.9 }}>
          Available stock: <b>{item.availableQty}</b>
        </div>
      )}
    </div>
  );
}