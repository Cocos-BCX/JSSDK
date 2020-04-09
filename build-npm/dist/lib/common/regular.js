"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// 邮箱
var MailReg = exports.MailReg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
// 包含0 正整数
var IntReg = exports.IntReg = /^([1-9]\d*|[0]{1,1})$/;
// 不包含0 正整数
var IntExclude0Reg = exports.IntExclude0Reg = /^[1-9]+\d*$/;

// 只能数字或小数 只能有一个小数点并且第一位不能为小数点
var IntegerOrDecimalReg = exports.IntegerOrDecimalReg = /^\d*\.{0,1}\d{0,1}$/;

// 对于多位数字第一位不能为0, 单个数字可以为0
var IntExclude0Reg1 = exports.IntExclude0Reg1 = /(^[1-9]([0-9]*)$|^[0-9]$)/;

// 对于多位数字第一位不能为0
var IntExclude0Reg2 = exports.IntExclude0Reg2 = /(^[1-9]([0-9]*)$)/;

// 对于多位数字第一位不能为0  小数点后5位
var IntegerOrDecimalReg1 = exports.IntegerOrDecimalReg1 = /^[1-9][0-9]*\.{0,1}\d{0,5}$/;

// 对于多位数字第一位可以为0  小数点后5位
var IntegerOrDecimalReg2 = exports.IntegerOrDecimalReg2 = /^[0-9]*\.{0,1}\d{0,5}$/;

var GithubAddrReg = exports.GithubAddrReg = /^https:\/\/github.com/;

// 包含数字，大小写，特殊符号
var AllReg = exports.AllReg = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)(?=.*?[#@*&.]).*$/;

var NewPassword = exports.NewPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*.-]).{12,}$/;