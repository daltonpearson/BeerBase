 
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var sql = require("mssql");
var app = express();



var top24s = 'SELECT TOP (50) *, prodAlc/100*prodQuantity*prodVol/prodPrice AS beerAPD, prodQuantity*prodVol/prodPrice AS beerVPD FROM PRODUCTS WHERE prodPackage = \'Bottle\' AND prodVol = 341 ORDER BY beerAPD DESC';
var topall = 'SELECT *, prodAlc/100*prodQuantity*prodVol/prodPrice AS beerAPD, prodQuantity*prodVol/prodPrice AS beerVPD FROM PRODUCTS ORDER BY beerAPD DESC'
app.use(express.static(__dirname + '/public/css'));
app.use(express.static(__dirname + '/public/landing'));

var getIP = require('ipware')().get_ip;
app.use(function(req, res, next) {
    var ipInfo = getIP(req);
    console.log(ipInfo);

    next();
});
function tabledata(recordset) {
    var reo ='<html><head><title>BeerBase</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="google-site-verification" content="9_UTZUNtMH7d0N3KmgdLFWHdsEWrZTF7TkWY8GV7u9Y" /><link href="style.css" rel="stylesheet"></head><div id="wrapper"><body><h1>BeerBase</h1><div id="searcharea"><form  method="get" action="/"><select name="sort"><option value="apd">APD</option><option value="name">Name</option><option value="percent">Percent</option></select><input class="search" type="search" name="search" placeholder="Search"><input class="button" type="submit" value="Hold My Beer!"></form></div>{${table}}</body><footer><hr><p>&#169; 2017 Dalton Pearson | Email: dalton1997@live.ca</p><hr></footer></div></html>';
    var table='';
    recordset=recordset.recordsets
    recordset = recordset[0]
    
    for(var i=0; i<Object.keys(recordset).length; i++){ 
        table +='<tr><td>'+ (i+1) + '</td><td>'+ recordset[i].prodName +'</td><td>'+ recordset[i].prodAlc +'</td><td>'+ recordset[i].prodQuantity +'</td><td>'+ recordset[i].prodPackage +'</td><td>'+ recordset[i].prodVol +'</td><td>'+ recordset[i].prodPrice +'</td><td>'+ recordset[i].beerAPD +'</td><td>'+ recordset[i].beerVPD +'</td></tr>';
      }
      table ='<table border="1"><tr><th>#</th><th>Name</th><th>Percent</th><th>Quantity</th><th>Container</th><th>Vol</th><th>Price</th><th>ml of Alcohol Per Dollar(ml of Alcohol/$)</th><th>Volume Per Dollar(ml/$)</th></tr>'+ table +'</table>';
    reo = reo.replace('{${table}}', table);    
    return reo;
}
function search(url){
    var terms = url;
    var search = terms.search;
    if (typeof search=='undefined'){search=''}
    //var query = 'SELECT *, prodAlc/100*prodQuantity*prodVol/prodPrice AS beerAPD, prodQuantity*prodVol/prodPrice AS beerVPD FROM PRODUCTS WHERE prodName LIKE \'%'+search+'%\'ORDER BY beerAPD DESC'
    search = '%'+search+'%'
    return search;
}
function sorter(url){
    var terms = url;
    var sort = terms.sort;
    
    if (sort=='name'){sort='prodName ASC'}
    else if (sort=='percent'){sort='prodAlc DESC'}
    else {sort='beerAPD DESC'}
    //var query = 'SELECT *, prodAlc/100*prodQuantity*prodVol/prodPrice AS beerAPD, prodQuantity*prodVol/prodPrice AS beerVPD FROM PRODUCTS WHERE prodName LIKE \'%'+search+'%\'ORDER BY beerAPD DESC'
    
    return sort;
}

app.use(bodyParser({
    extended: true
}));

app.use(bodyParser.json());

app.get('/', function (req, res) {
    var terms=search(url.parse(req.url, true).query);
    var sort=sorter(url.parse(req.url, true).query);
    console.log(sort)
    //console.log(typeof.sort)
    //query=search()
    

/*  // school db config
    var config = {
        user: 'user',
        password: 'password',
        server: 'server', 
        database: 'database' 
    };
*/
    //home db config
    var config = {
        driver: "ODBC Driver 13 for SQL Server",
        server: "server",
        user: "user",
        password: "password",
        database: "database",
        options: {trustedConnection: true}
    }

    // connect to your database
    sql.connect(config, function (err) {       
        if (err) console.log(err);
        var name = terms
        //var sortcat = sort
        //console.log(sort);
        const request = new sql.Request();
        request.input('name', sql.VarChar, terms);
        //request.input('sort', sql.VarChar, 'beerAPD');
        
        console.log(request.parameters)
        try{request.query('SELECT *, prodAlc/100*prodQuantity*prodVol/prodPrice AS beerAPD, prodQuantity*prodVol/prodPrice AS beerVPD FROM PRODUCTS WHERE prodName LIKE @name ORDER BY '+sort, function (err, recordset){
                if (err) console.log(err)
                    sql.close()
                res.send(tabledata(recordset));
                sql.close()
                console.log("done")
        })}
        catch(err){console.log("error to many searches")}
    });
});

//Working well
var server = app.listen(3000, "ip",function () {
    console.log(server.address.address);
    console.log('Server is running..');
});