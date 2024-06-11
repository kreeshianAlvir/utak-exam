export function numberOnly(e) {
  const key = e.key;
  const ctrl = e.ctrlKey;
  const exception = ["Backspace", "ArrowLeft", "ArrowRight"];

  if (
    key.match(/\d/) === null &&
    exception.includes(key) === false &&
    ctrl === false
  ) {
    e.preventDefault();
  }
}

export function decimalFormat(e) {
  const key = e.key;
  const value = e.target.value;

  if (key === "." && value.indexOf(".") === -1) {
    return;
  }
  numberOnly(e);

  e.target.value = value.toLocaleString();
}
