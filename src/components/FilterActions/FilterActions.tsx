const FilterActions = ({
  onApply,
  onReset,
}: {
  onApply: () => void;
  onReset: () => void;
}) => (
  <div className="mt-4 flex justify-between">
    <button className="btn btn-primary btn-sm" onClick={onApply}>
      Aplicar Filtros
    </button>
    <button className="btn btn-outline btn-sm" onClick={onReset}>
      Resetar Filtros
    </button>
  </div>
);
export default FilterActions;
