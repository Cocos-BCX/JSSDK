// 邮箱
export const MailReg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
// 包含0 正整数
export const IntReg = /^([1-9]\d*|[0]{1,1})$/;
// 不包含0 正整数
export const IntExclude0Reg = /^[1-9]+\d*$/;

// 只能数字或小数 只能有一个小数点并且第一位不能为小数点
export const IntegerOrDecimalReg = /^\d*\.{0,1}\d{0,1}$/;

// 对于多位数字第一位不能为0, 单个数字可以为0
export const IntExclude0Reg1 = /(^[1-9]([0-9]*)$|^[0-9]$)/

// 对于多位数字第一位不能为0
export const IntExclude0Reg2 = /(^[1-9]([0-9]*)$)/


// 对于多位数字第一位不能为0  小数点后5位
export const IntegerOrDecimalReg1 = /^[1-9][0-9]*\.{0,1}\d{0,5}$/

// 对于多位数字第一位可以为0  小数点后5位
export const IntegerOrDecimalReg2 = /^[0-9]*\.{0,1}\d{0,5}$/


export const GithubAddrReg = /^https:\/\/github.com/;

// 包含数字，大小写，特殊符号
export const AllReg = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)(?=.*?[#@*&.]).*$/;

export const NewPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*.]).{12,}$/;