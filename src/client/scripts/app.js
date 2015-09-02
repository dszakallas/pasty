;(function(){
  'use strict';

  angular.module('Pasty', [ 'ui.ace' ])
    .run(function() {

      //3rd party stuff

      $(function() {
        $('[data-toggle="tooltip"]').tooltip();
      });

    })
    .controller('Main', [ '$scope', '$location', 'pasty', '$q', function($scope, $location, pasty, $q){

      var location = {
        id: function(id) {
          if (typeof(id) === 'undefined')
            return $location.path().substr(1);
          else
            $location.path("/" + id);
        },
        password: function(pass) {
          if (typeof(pass) === 'undefined')
            return $location.hash();
          else
            $location.hash(pass);            
        }
      };

      var generatePassword = function() {
          return sjcl.codec.base64url.fromBits(sjcl.random.randomWords(4));
      };

      var messaging = {

        wrap: function(content) {
          var randoms = sjcl.random.randomWords(3);

          var params = {
            cipher: 'aes',
            ks: 256,
            mode: 'gcm',
            ts: 64,
            iter: 1000,
            iv: randoms[0]
          };
          
          var plaintext = JSON.stringify(content);

          var cyphertext = sjcl.encrypt(location.password(), plaintext, params, params);

          var hmac = sjcl.codec.hex.fromBits(new sjcl.misc.hmac(
            params.key, 
            sjcl.hash.sha256
          ).encrypt(plaintext));

          return {
            hmac: hmac,
            content: cyphertext
          };

        },

        unwrap: function(message) {

          var params = {};

          var plaintext = sjcl.decrypt(location.password(), message.content, params, params);

          var hmac = sjcl.codec.hex.fromBits(new sjcl.misc.hmac(
            params.key, 
            sjcl.hash.sha256
          ).encrypt(plaintext));           

          if(hmac === message.hmac)
            return JSON.parse(plaintext);
          else 
            throw new Error("Couldn't verify message contents.");

        }

      };

      var watchForChanges = function(id, socket, editor) {

        var d = $q.defer();

        socket.on('change', function(data) {
          console.log("Pasty " + id + " changed by someone");
          try {
            editor.setValue(messaging.unwrap(data));
          } catch (e) {
            if(e instanceof TypeError) 
              console.log("Failed to decrypt message.");
            else
              console.log(e.message);
          }
        });

        socket.on('disconnect', function() {
          //@TODO insert alert popup
          console.log('Pasty ' + id + ' disconnected');
          // only resolve on disconnect
          d.resolve();
        });

        editor.on('change', function(delta) {
          //no delta yet, just send everything
          
          if (editor.curOp && editor.curOp.command.name) {
            socket.emit('change', messaging.wrap(editor.getValue()));
          }

        });

        var idWatch = $scope.$watch(function(){ return $location.path(); }, function(newVal, oldVal){
          if(oldVal != newVal) {
            console.log("Location changed. Disconnecting from Pasty " + oldVal);
            pasty.disconnect(socket);
            idWatch(); // kill the watches, no need for it anymore
            //Not sure if this needed here, but better resolve twice than none.
            d.resolve();
          }
        });



        console.log("Subscribed to changes on Pasty " + id);

        return d.promise;
      };


      var main = function(id, editor) {

        var d = $q.defer();

        if(id) {
          pasty.connect(id).then(
            function(socket){
              d.resolve(watchForChanges(id, socket, editor));
            },
            function(e){
              console.log('Could not connect to Pasty ' + id);

              if(e === "not found") {
                console.log("Pasty " + id + " not found. Creating it...")
                pasty.create(id).then(
                  function(id) {
                    console.log("Pasty " + id + " created");
                    location.id(id);
                    location.password(generatePassword());
                    d.resolve();
                  },
                  function(e) {
                    console.log("Server refused creating Pasty " + id)
                    location.id("");
                    location.password("");
                    d.resolve();
                  });
              } else {
                location.id("");
                location.password("");
                d.resolve();
              }
            }
          );
        } else {
          console.log("Empty URL. Creating new Pasty...");
          pasty.create().then(function(id) {
            console.log("Pasty " + id + " created");
            location.id(id);
            location.password(generatePassword());
            d.resolve();
          });
        }
        return d.promise;
      };


      $scope.aceOption = {
        onLoad: function (ace) {
          ace.$blockScrolling = Infinity

          //Non-blocking loop

          //changes from true to false to true to false.. etc
          var tick = true;

          $scope.$watch(
            function(){ return tick; }, 
            function(){ main(location.id(), ace).then( function() { tick = !tick; } ); }
          );
        }
      };

    }]);

})();