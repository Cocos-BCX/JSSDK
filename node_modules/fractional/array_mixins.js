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
