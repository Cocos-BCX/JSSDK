/*
fraction.js
A Javascript fraction library.

Copyright (c) 2009  Erik Garrison <erik.garrison@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/


/* Array extensions that are in Javascript 1.6 */

/*
Array.prototype.forEach = function(fn)
{
    for (var i=0;i<this.length;i++)
    {
        fn(this[i]);
    }
}

Array.prototype.filter = function(fn)
{
    r = [];
    this.forEach(function (item) { if (fn(item)) r.push(item); });
    return r;
}

Array.prototype.map = function(fn) 
{
    var r = [];
    for (var i=0;i<this.length;i++)
    {
        r.push(fn(this[i]));
    }
    return r; 
}
*/

/* Array extensions that let us do set theoretic operations */

Array.prototype.reduce = function(fn, initial)
{
    var r, i;
    // initial is optional, defaults to first item in list
    initial ? r = initial : r = this[0];

    for (i=1;i<this.length;i++)
    {
        r = fn(r, this[i]);
    }
    return r;
}

Array.prototype.copy = function(t)
{
    r = [];
    this.forEach(function (item) { r.push(item); });
    return r;
}

Array.prototype.toHash = function()
{
// returns hash of { item : true, ... } for all unique items in array
    var r = new Hashtable();
    this.forEach(function (item) { r.put(item, true); });
    return r;
}

Array.prototype.unique = function() 
{
// s.unique() -->
// new array with unique elements of s
    var h = {};  // use a hash-sieve
    var r = [];
    this.forEach(function (item) { h[item] = true; });
    for (var item in h)
    {
        r.push(item);
    }
    return r; 
}

Array.prototype.union = function(t)
{
// s.union(t) -->
// new set with elements from both s and t
    return this.concat(t).unique();
}

Array.prototype.intersection = function(t)
{
// s.intersection(t) -->
// new array with elements common to s and t
    var s = this.toHash();
    var t = t.toHash();
    var intersection = [];
    s.keys().forEach(function(item)
    {
        if (t.containsKey(item))
            intersection.push(item);
    });
    t.keys().forEach(function(item)
    {
        if (s.containsKey(item))
            intersection.push(item);
    });
    return intersection;
}

Array.prototype.difference = function(t)
{
// s.difference(t) -->
// new array with elements in s but not in t
    var t = t.toHash();
    var r = [];
    this.forEach(function (item) { if (!t.containsKey(item)) r.push(item); });
    return r;
}

Array.prototype.symmetricDifference = function(t)
{
// s.symmetricDifference(t) -->
// new array with elements in either s or t but not both
    return this.union(t).difference(this.intersection(t));
}


/* Fractions */

/* this constructor takes either numerator, denominator as numbers
 * or can construct the fraction from a string representing the fraction.
 *
 * Fractions are nothing more than ratios, and only two pieces of state are
 * held, this.numerator and this.denominator.
 *
 * All operations on fractions accept both numbers and fraction objects.
 *
 * Fractions are always stored internally in normalized format.
 *
 * e.g. new Fraction(1, 2) --> 1/2
 *      new Fraction('1/2') --> 1/2
 *      new Fraction('2 3/4') --> 11/4  (prints as 2 3/4)
 */
function Fraction(numerator, denominator)
{
    /* double argument invocation */
    if (numerator && denominator) {
        if (typeof(numerator) === 'number' && typeof(denominator) === 'number') {
            this.numerator = numerator;
            this.denominator = denominator;
        } else if (typeof(numerator) === 'string' && typeof(denominator) === 'string') {
            // what are they?
            // hmm....
            // assume they are ints?
            this.numerator = parseInt(numerator);
            this.denominator = parseInt(denominator);
        }
    /* single-argument invocation */
    } else if (!denominator) {
        num = numerator; // swap variable names for legibility
        if (typeof(num) === 'number') {  // just a straight number init
            this.numerator = num;
            this.denominator = 1;
        } else if (typeof(num) == 'string') {
            var a, b;  // hold the first and second part of the fraction, e.g. a = '1' and b = '2/3' in 1 2/3
                       // or a = '2/3' and b = undefined if we are just passed a single-part number
            [a, b] = num.split(' ');
            /* compound fraction e.g. 'A B/C' */
            if (isInteger(a) && b && b.match('/')) {
                return (new Fraction(a)).add(new Fraction(b));
            } else if (a && !b) {
                /* simple fraction e.g. 'A/B' */
                if (typeof(a) == 'string' && a.match('/')) {
                    // it's not a whole number... it's actually a fraction without a whole part written
                    var f = a.split('/');
                    this.numerator = f[0]; this.denominator = f[1];
                /* string floating point */
                } else if (typeof(a) == 'string' && a.match('\.')) {
                    return new Fraction(parseFloat(a));
                /* whole number e.g. 'A' */
                } else { // just passed a whole number as a string
                    this.numerator = parseInt(a);
                    this.denominator = 1;
                }
            } else {
                return undefined; // could not parse
            }
        }
    }
    this.normalize();
}

/*  test data
var x = "3 eggs\n" +
"42 1/2 chickens\n" +
"1 tahini\n" + 
"2.4 bottles of vodka\n";
var numre = /(\d+\s\d+[\./]\d+|\d+[\.\/]\d+|\d+)/g;
*/


Fraction.prototype.clone = function()
{
    return new Fraction(this.numerator, this.denominator);
}

Fraction.prototype.toString = function()
{
    /* pretty-printer, converts fractions into whole numbers and fractions */
    var wholepart = Math.floor(this.numerator / this.denominator);
    var numerator = this.numerator % this.denominator 
    var denominator = this.denominator;
    var result = [];
    if (wholepart != 0) 
        result.push(wholepart);
    if (numerator != 0)  
        result.push(numerator + '/' + denominator);
    return result.length > 0 ? result.join(' ') : 0;
}

Fraction.prototype.rescale = function(factor)
{
    this.numerator *= factor;
    this.denominator *= factor;
    return this;
}

Fraction.prototype.add = function(b)
{
    if (b instanceof Fraction) {
        b = b.clone();  // we scale our argument destructively, so clone
    } else if (typeof b == 'number') {
        b = new Fraction(b);
    }
    td = this.denominator;
    this.rescale(b.denominator);
    b.rescale(td);

    this.numerator += b.numerator;

    return this.normalize();
}

Fraction.prototype.subtract = function(b)
{
    if (b instanceof Fraction) {
        b = b.clone();  // we scale our argument destructively, so clone
    } else if (typeof b == 'number') {
        b = new Fraction(b);
    }
    td = this.denominator;
    this.rescale(b.denominator);
    b.rescale(td);

    this.numerator -= b.numerator;

    return this.normalize();
}

Fraction.prototype.multiply = function(b)
{
    if (b instanceof Fraction)
    {
        this.numerator *= b.numerator;
        this.denominator *= b.denominator;
        this.normalize();
    } else if (typeof b == 'number') {
        this.numerator *= b;
        this.normalize();
    }
    return this.normalize();
}

Fraction.prototype.divide = function(b)
{
    if (b instanceof Fraction)
    {
        this.numerator /= b.numerator;
        this.denominator /= b.denominator;
    } else if (typeof b == 'number') {
        this.numerator /= b;
    }
    return this.normalize();
}

Fraction.prototype.equals = function(b)
{
    if (typeof b == 'number') {
        b = new Fraction(b);
    }
    var a = this.clone().normalize();
    var b = b.clone().normalize();
    return (a.numerator === b.numerator && a.denominator === b.denominator);
}

function roundToPlaces(n, places) 
{
    if (!places) {
        return Math.round(n);
    } else {
        var scalar = Math.pow(10, places);
        return Math.round(n*scalar)/scalar;
    }
}

Fraction.prototype.normalize = function()
{
    //first check if we have decimals, and if we do eliminate them
    // multiply by the 10 ^ number of decimal places in the number
    // round the number to nine decimal places
    // to avoid floating point funnies
    if (isFloat(this.denominator)) {
        var rounded = roundToPlaces(this.denominator, 9);
        var scaleup = Math.pow(10, rounded.toString().split('.')[1].length);
        this.denominator = Math.round(this.denominator * scaleup); // this !!! should be a whole number
        //this.numerator *= scaleup;
        this.numerator *= scaleup;
    } 
    if (isFloat(this.numerator)) {
        var rounded = roundToPlaces(this.numerator, 9);
        var scaleup = Math.pow(10, rounded.toString().split('.')[1].length);
        this.numerator = Math.round(this.numerator * scaleup); // this !!! should be a whole number
        //this.numerator *= scaleup;
        this.denominator *= scaleup;
    }
    var gcf = Math.gcf(this.numerator, this.denominator);
    this.numerator /= gcf;
    this.denominator /= gcf;
    return this;
}

// returns fraction, integer, or float from string
function parseNumber(s)
{
    if (s.match(/\./)) {
        return parseFloat(s);
    } else if (s.match(/\//)) {
        return new Fraction(s); 
    } else {
        return parseInt(s);
    }
}

function isInteger(n)
{
    return n % 1 == 0;
}

function isFloat(n)
{
    return (typeof(n) == 'number' && 
            ((n > 0 && n % 1 > 0 && n % 1 < 1) || 
             (n < 0 && n % -1 < 0 && n % -1 > -1))
           );
}

// returns the number of floating points in the number
function floatingPoints(n)
{
    var d = n.toString().split('.')[1]
    return (d) ? d.length : 0;
}

function isFraction(s)  // operates on strings ... hmm
{
    return /\d+\/\d+/.test(s);
}

/* math extensions */

// takes two numbers
// returns their greatest common factor
Math.gcf = function(a, b)
{

    var common_factors = [];
    var fa = Math.primeFactors(a);
    var fb = Math.primeFactors(b);
    fa.union(fb).forEach(function (factor) 
    { 
        function f(x) { return x == factor };
        var _fa = fa.filter(f);
        var _fb = fb.filter(f);
        if (_fa.length > 0 && _fb.length > 0) {
            common_factors = common_factors.concat(_fa.length < _fb.length ? _fa : _fb);
        }
    });

    if (common_factors.length == 0)
        return 1;

    var gcf = common_factors.reduce(function (a, b) { return a * b; });
    return gcf;

}

// from: 
// http://www.btinternet.com/~se16/js/factor.htm
Math.primeFactors = function(n) 
{

    var num = n;
    var factors = [];
    var _factor = 2;  // first potential prime factor

    while (_factor * _factor <= num)  // should we keep looking for factors?
    {      
      if (num % _factor == 0)  // this is a factor
        { 
            factors.push(_factor);  // so keep it
            num = num/_factor;  // and divide our search point by it
        }
        else
        {
            _factor++;  // and increment
        }
    }

    if (num != 1)                          // If there is anything left at the end...
    {                                      // ...this must be the last prime factor
        factors.push(num);           //    so it too should be recorded
    }

    return factors;                           // Return the prime factors
}

/* Tests */
/* uncomment for use

function assert(value, message)
{
    if (!value)
        throw new Error('AssertionError ' + message);
}

function assertEquals(a, b)
{
    if (!(a === b))
        throw new Error('AssertionError: ' + a + ' !=== ' + b);
}

function tests()
{
    var pairs = [[new Fraction('1/4'), new Fraction('0.25')], 
                 [new Fraction('3/2'), new Fraction('1 1/2')],
                 [new Fraction(2,3), new Fraction(2/3)],  // FAILS XXX, poor rounding handling
                 [new Fraction('7/8'), new Fraction('0.875')],
                 [new Fraction('1/3'), new Fraction(1, 3)],
                 [new Fraction('1/9'), new Fraction(1, 9)],
                 // maybe this is unreasonable...
                 //[new Fraction(1/3),   new Fraction(1, 3)],
                 // not even the python standard fraction library gets
                 // irrational decimals right
                 ];
    var pair;
    while (pair = pairs.pop())
    {
        print('testing ' + pair);
        for (i in pair)
        {
            assert(pair[i]);
        }
        print('?: ' + pair[0] + ' === ' + pair[1])
        assertEquals(pair[0].numerator, pair[1].numerator);
        assertEquals(pair[0].denominator, pair[1].denominator);
        print('pass');
    }

}

*/
