import { Search } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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
  onChange?: (value: string) => void;
  hasSelection?: boolean;
  value?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onReset?: () => void;
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
    onChange,
    hasSelection,
    value,
    inputRef,
    onReset,
  } = props;

  const divRef = useRef<HTMLDivElement>(null);
  const defaultInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef || defaultInputRef;
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [required] = useState<boolean>(register?.required || false);

  const isError = errors && register && errors[register.name];

  useEffect(() => {
    if (actualInputRef.current && value !== undefined && !isTyping) {
      if (value === "") {
        actualInputRef.current.value = "";
        onReset && onReset();
      } else if (actualInputRef.current.value !== value) {
        actualInputRef.current.value = value;
      }
    }
  }, [value, actualInputRef, onReset, isTyping]);

  function handleSelectItem(option: Option) {
    if (actualInputRef.current) actualInputRef.current.value = option.label;
    removeFocusDiv();
    register?.onChange({ target: { name, value: option.value } });

    onChange && onChange(option.value);

    actualInputRef.current?.blur();

    setIsFocused(false);
    setShowDropdown(false);
    setIsTyping(false);
  }

  function handleBlur(e: any) {
    const value = e.target.value;

    if (options?.find((option) => option.label === value)) {
      return;
    }
    if (actualInputRef.current && !hasSelection) {
      actualInputRef.current.value = "";
      register?.onChange({ target: { name, value: "" } });
      onChange && onChange("");
    }

    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setIsTyping(false);
    }, 200);
  }

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsTyping(true);
    setShowDropdown(true);
    inputChange && inputChange(e);
  }

  function handleFocus() {
    setIsFocused(true);
    setShowDropdown(true);
  }

  function removeFocusDiv() {
    divRef.current?.focus();
    divRef.current?.blur();
  }

  const shouldShowDropdown =
    isFocused && showDropdown && (isTyping || !hasSelection);

  return (
    <>
      <div tabIndex={-1} className="dropdown" ref={divRef}>
        <label
          className={`input input-bordered flex items-center gap-2 ${className} ${
            isError ? "input-error" : "input-primary"
          }`}
        >
          <input
            ref={actualInputRef}
            type="text"
            className="grow"
            placeholder={placeholder}
            onChange={handleOnChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
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
        {shouldShowDropdown && (
          <ul
            tabIndex={0}
            className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-full"
          >
            {loading && (
              <span className="loading loading-spinner loading-md text-primary mx-auto py-4"></span>
            )}

            {!loading &&
              options &&
              options.length > 0 &&
              options.map((option, index) => (
                <li key={index} onClick={() => handleSelectItem(option)}>
                  <a>{option.label}</a>
                </li>
              ))}

            {!loading && isFocused && options?.length === 0 && (
              <li className="text-center text-sm py-6">{contentText}</li>
            )}
          </ul>
        )}
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
