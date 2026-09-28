// luhn.js：校验位与校验（右起奇数位翻倍、超过九减九）
function doubled(charCode) {
  const value = (charCode - 48) * 2;
  return value > 9 ? value - 9 : value;
}

// 右起第 1、3、5… 位翻倍算出基准，再补到十的倍数。
export function digitOf(digits) {
  const text = String(digits);
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) {
    const charCode = text.charCodeAt(text.length - 1 - i);
    const value = charCode - 48;
    sum += i % 2 === 0 ? doubled(charCode) : value;
  }
  return (10 - (sum % 10)) % 10;
}

// 整串（含校验位）右起第 2、4、6… 位翻倍后能被十整除即通过。
export function okOf(digits) {
  const text = String(digits);
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) {
    const charCode = text.charCodeAt(text.length - 1 - i);
    const value = charCode - 48;
    sum += i % 2 === 1 ? doubled(charCode) : value;
  }
  return sum % 10 === 0;
}
