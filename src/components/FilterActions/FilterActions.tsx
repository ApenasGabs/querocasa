const FilterActions = ({
  onApply,
  onReset,
}: {
  onApply?: () => void;
  onReset: () => void;
}) =>
  onApply ? (
    <div className="mt-4 flex justify-between">
      <button className="btn btn-primary btn-sm" onClick={onApply}>
        Aplicar Filtros
      </button>
      <button className="btn btn-outline btn-sm" onClick={onReset}>
        Resetar Filtros
      </button>
    </div>
  ) : (
    <button className="btn m-1  " onClick={onReset}>
      Resetar Filtros
    </button>
  );
export default FilterActions;
