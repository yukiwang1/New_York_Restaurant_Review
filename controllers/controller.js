const mysql = require('mysql');
const Redis = require('redis');

const redisClient = Redis.createClient({ host: 'localhost', port: '6379' })
redisClient.connect()

const connection = mysql.createConnection({
    host: "new-york-restaurant-review.cxxqtwsh8qjf.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "12341234",
    port: "3306",
    database: "NYCRest",
    multipleStatements: true
});
connection.connect();

module.exports.index = async (req, res) => {
    res.render('index')
}

module.exports.restaurants = async (req, res) => {

    connection.query(`WITH DistinctRestaurants AS (
        SELECT DISTINCT doh_id, name, boro, COUNT(camis) as num_violations
        FROM yelp
                 JOIN nychealth ON nychealth.restaurant_id = yelp.doh_id
        GROUP BY nychealth.restaurant_id, yelp.name
        ORDER BY yelp.name
    )
    SELECT doh_id, name, boro, num_violations
    FROM DistinctRestaurants;`, function (error, results, fields) {

        if (error) {
            console.log(error)
            res.json({ error: error })
        } else if (results) {
            //res.json({ results: results })
            var processedData = processData(results)
            res.render('restaurants', { data: results, processedData: processedData });

        }
    });
}

function processData(data) {
    var total = 0;
    var totalByArea = {};
    data.forEach(function (dataObject) {
        total += dataObject.num_violations;
        if (dataObject.boro in totalByArea) {
            totalByArea[dataObject.boro] += dataObject.num_violations;
        } else {
            totalByArea[dataObject.boro] = 0;
            totalByArea[dataObject.boro] += dataObject.num_violations;
        }
    });
    var processedData = {
        total: total,
        totalByArea: totalByArea
    };
    return processedData;
}

module.exports.restaurant = async (req, res) => {
    connection.query(`SELECT *
        FROM yelp
        WHERE doh_id=${req.params.id};
        SELECT *
        FROM nychealth
        WHERE restaurant_id=${req.params.id};`, function (error, results, fields) {

        if (error) {
            console.log(error)
            res.json({ error: error })
        } else if (results) {
            //res.json({ results: results })
            res.render('restaurant', { data: results, restaurant: results[0], violations: results[1] });

        }
    });

}


module.exports.infractions = async (req, res) => {

    connection.query(`
SELECT DISTINCT violationcode, violationdescription, criticalflag, COUNT(violationcode) as num_violations_in_NY
FROM nychealth
GROUP BY violationcode
ORDER BY num_violations_in_NY DESC;
`, function (error, results, fields) {

        if (error) {
            console.log(error)
            res.json({ error: error })
        } else if (results) {

            res.render('infractions', { data: results });

            //res.json({ results: results })
        }
    });

    // TODO: update with html template
    //res.render('infractions');
}

module.exports.infraction = async (req, res) => {
    connection.query(`SELECT violationcode, name, url, inspectiondate, address1, address2, city, zip
    FROM yelp JOIN nychealth ON nychealth.restaurant_id = yelp.doh_id
    WHERE violationcode="${req.params.id}"
    ORDER BY inspectiondate;`, function (error, results, fields) {

        if (error) {
            console.log(error)
            res.json({ error: error })
        } else if (results) {
            res.render('infraction', { data: results, infractioncode: req.params.id });
        }
    });


}

module.exports.zips = async (req, res) => {
    connection.query(`WITH Restaurant_zip_2019 AS (
        SELECT medianincome.zip, medianincome.median_income, COUNT(yelp.doh_id) as num_restaurants
        FROM medianincome
        JOIN yelp on medianincome.zip = yelp.zip
        WHERE medianincome.timeframe='2019'
        GROUP BY medianincome.zip
    ), Violations_zip_2019 AS (
        SELECT medianincome.zip, COUNT(nychealth.camis) as num_historical_violations
        FROM medianincome
        JOIN nychealth on medianincome.zip = nychealth.zipcode
        WHERE medianincome.timeframe='2019'
        GROUP BY medianincome.zip
    )
    SELECT Restaurant_zip_2019.zip, median_income, num_restaurants, num_historical_violations
    FROM Restaurant_zip_2019 JOIN Violations_zip_2019 ON Restaurant_zip_2019.zip=Violations_zip_2019.zip
    ORDER BY num_restaurants DESC;`, function (error, results, fields) {

        if (error) {
            console.log(error)
            res.json({ error: error })
        } else if (results) {
            res.render('zips', { data: results });
        }
    });

}

module.exports.zip = async (req, res) => {
    // results[0]: restaurants in zip
    // results[1]: 10 most common violations in zip
    // results[2]: median income of zip
    connection.query(`SELECT *
    FROM yelp
    WHERE zip = "${req.params.id}"
    LIMIT 1;

    SELECT zipcode, violationcode, violationdescription, COUNT(nychealth.camis) as num_violation
    FROM nychealth
    WHERE zipcode="${req.params.id}"
    GROUP BY zipcode, violationcode
    ORDER BY num_violation DESC
    LIMIT 10;

    SELECT median_income as median_income_2019
    FROM medianincome
    WHERE zip = '${req.params.id}' and timeframe = '2019';`, function (error, results, fields) {

        if (error) {
            console.log(error);
            res.json({ error: error });
        } else if (results) {
            //res.json({ results: results });

            var restaurantsInZip = results[0];
            var violationsInZip = results[1];
            var medianIncomeInZip = results[2];

            res.render('zip', { data: results, zip: req.params.id, restaurantsInZip: restaurantsInZip, violationsInZip: violationsInZip, medianIncomeInZip: medianIncomeInZip });

        }
    });

}
