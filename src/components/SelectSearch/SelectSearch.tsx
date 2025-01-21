import { Search } from "lucide-react";
import React, { useRef, useState } from "react";
import {
  FieldErrors,
  FieldValues,
  UseFormRegisterReturn,
} from "react-hook-form";

export type Option = {
  label: string;
  value: string;
};

export type SelectSearchProps = {
  name: string;
  className?: string;
  placeholder?: string;
  contentText?: string;
  inputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  options?: Option[];
  loading?: boolean;
  register?: UseFormRegisterReturn<string>;
  errors?: FieldErrors<FieldValues>;
};

export const SelectSearch: React.FC<SelectSearchProps> = ({
  name,
  ...props
}) => {
  const {
    className,
    placeholder,
    contentText,
    inputChange,
    options,
    loading,
    register,
    errors,
  } = props;

  const divRef = useRef<HTMLDivElement>(null);
  const inputShowRef = useRef<HTMLInputElement>(null);

  const [required] = useState<boolean>(register?.required || false);

  const isError = errors && register && errors[register.name];

  function handleSelectItem(option: Option) {
    if (inputShowRef.current) inputShowRef.current!.value = option.label;
    removeFocusDiv();
    register?.onChange({ target: { name, value: option.value } });
  }

  function handleBlur(e: any) {
    const value = e.target.value;

    if (options?.find((option) => option.label === value)) {
      return;
    }
    if (inputShowRef.current) {
      inputShowRef.current.value = "";
      register?.onChange({ target: { name, value: "" } });
    }
  }

  function handleOnChange(e: any) {
    const value = e.target.value;
    inputChange && inputChange(value);
  }

  function removeFocusDiv() {
    divRef.current?.focus();
    divRef.current?.blur();
  }

  return (
    <>
      <div tabIndex={-1} className="dropdown" ref={divRef}>
        <label
          className={`input input-bordered flex items-center gap-2 ${className} ${
            isError ? "input-error" : "input-primary"
          }`}
        >
          <input
            ref={inputShowRef}
            type="text"
            className="grow"
            placeholder={placeholder}
            onChange={handleOnChange}
            onBlur={handleBlur}
            required={required}
          />
          <select className="hidden" {...register}>
            {options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Search size={22} className="text-base" />
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content dropdown-open z-10 menu p-2 shadow bg-base-100 rounded-box w-full"
        >
          {loading && (
            <span className="loading loading-spinner loading-md text-primary mx-auto py-4"></span>
          )}

          {!loading &&
            options &&
            options?.map((option, index) => (
              <li key={index} onClick={() => handleSelectItem(option)}>
                <a>{option.label}</a>
              </li>
            ))}

          {!loading && !options?.length && (
            <li className="text-center text-sm py-6">{contentText}</li>
          )}
        </ul>
      </div>
      {isError && (
        <span className="w-full text-start text-error text-sm">
          {" "}
          {`${errors[register.name]?.message}`}{" "}
        </span>
      )}
    </>
  );
};
