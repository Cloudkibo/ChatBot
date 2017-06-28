'use strict';
var unirest = require('unirest');

module.exports = function (app) {

  app.route('/query')
    .post(function (req, res) {

      console.log(req.body);

      var today = new Date();
      var uid = Math.random().toString(36).substring(7);
      var unique_id = 'h' + uid + '' + today.getFullYear() + '' + (today.getMonth() + 1) + '' + today.getDate() + '' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();

      var query = [];
      query.push(req.body.query);

      var myJSONObject = {
        query: query,
        lang: 'en',
        sessionId: unique_id,
        from: 'user',
        msg: query[0],
        timestamp: Date.now()
      };

      unirest.post('https://api.api.ai/v1/query')
        .headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': ' Bearer da0a2772468e4af2a677d5da5f6d2618'
        })
        .send(JSON.stringify(myJSONObject))
        .end(function (response) {
          console.log(response.body);
          if (response.body.status.code >= 400) {
            res.status(response.body.status.code).json({status: 'error', body: response.body.status});
          } else if (response.body.status.code === 200) {

            var result = response.body.result;
            if (result.action === 'weather') {
              var YQL = require('yql');

              var city = result.parameters.address.city || 'Karachi';

              var query = new YQL('select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="' + city + '")');

              // todo check the time for weather foecast. it shows current time for now
              query.exec(function (err, data) {
                var location = data.query.results.channel.location;
                var condition = data.query.results.channel.item.condition;

                var unit = result.parameters.unit || 'F';
                var temp = condition.temp;

                if (unit === 'C') {
                  temp = (temp - 32) * 0.5556;
                }

                var responseMessage = 'The weather in ' + location.city + ', ' + location.region + ' is ' + temp + ' degrees.';
                console.log(responseMessage);

                res.status(response.body.status.code).json({status: 'success', body: responseMessage});
              });
            } else {
              if(result.speech) {
                res.status(response.body.status.code).json({status: 'success', body: result.speech});
              } else {
                res.status(response.body.status.code).json({status: 'success', body: response.body.result});
              }
            }

          } else {
            res.status(response.body.status.code).json({status: 'error', body: response.body});
          }
        });

    });
};
