# fractional

a fraction arithmetic library written in javascript.

```
npm install fractional
```

## Usage

```js
var Fraction = require('fractional').Fraction

// Create a new fraction with the new keyword:

(new Fraction(7,3)).multiply(new Fraction(1,2)).toString()
// 1 1/6

(new Fraction(7,3)).divide(new Fraction(1,2)).toString()
// 4 2/3

(new Fraction(3,10)).add(new Fraction(5,9)).toString()
// 77/90

(new Fraction(0.25)).add(new Fraction(1,6)).toString()
// 5/12

(new Fraction(0.35)).subtract(new Fraction(1,4)).toString()
// 1/10
```

## It's basic arithmetic

Fractional provides a simple interface to add, subtract, multiply, and divide fractions.

Fractions are represented in most-normalized form.

## License

MIT

## Author

Erik Garrison <erik.garrison@gmail.com>
