// luhn.js：校验位与整串校验（Luhn 变体：右起第 1、3、5…位翻倍）
function doubledAt(digits, rightOffset) {
  const ch = digits.charCodeAt(digits.length - 1 - rightOffset) - 48;
  const d = ch * 2;
  return d > 9 ? d - 9 : d;
}

// 按右起第 1、3、5…位翻倍（超过九减九）算基准，校验位补到十的倍数。
export function digitOf(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const d = digits.charCodeAt(digits.length - 1 - i) - 48;
    sum += i % 2 === 0 ? doubledAt(digits, i) : d;
  }
  return (10 - (sum % 10)) % 10;
}

// 整串含校验位：右起第 2、4、6…位翻倍，总和能被十整除即通过。
export function okOf(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const d = digits.charCodeAt(digits.length - 1 - i) - 48;
    sum += i % 2 === 1 ? doubledAt(digits, i) : d;
  }
  return sum % 10 === 0;
}
