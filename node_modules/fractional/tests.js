/* Tests */

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

function equalityTests()
{
    var pairs = [
                 // maybe this is unreasonable...
                 // not even the python standard fraction library gets
                 // irrational decimals right
                 [new Fraction(1/3),   new Fraction(1, 3)],
                 [new Fraction(2,3), new Fraction(2/3)],  // FAILS XXX, poor rounding handling
                 [new Fraction('2/3'), new Fraction(2, 3)],  // FAILS XXX, poor rounding handling
                 [new Fraction('1/4'), new Fraction('0.25')], 
                 [new Fraction('3/2'), new Fraction('1 1/2')],
                 [new Fraction('7/8'), new Fraction('0.875')],
                 [new Fraction('1/3'), new Fraction(1, 3)],
                 [new Fraction('1/9'), new Fraction(1, 9)],
                 [new Fraction('4/7'), new Fraction('4/7')],
                 [new Fraction(2, 9), new Fraction(2, 9)],
                 [new Fraction(1), new Fraction(1)],
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

function tests()
{
    equalityTests();
}

// run 'em
tests();
