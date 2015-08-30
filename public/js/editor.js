;(function(){
  'use strict';

  angular.module('Pasty').directive('editor', function() {
    return {
      controller: [ '$scope', '$location', 'share', '$q', function($scope, $location, share, $q){

        var main = function(editor) {

          var clearLocation = function() {
            $location.path("");
            $location.search("");
            $location.hash("");
          };

          var d = $q.defer();

          console.log("Entered main loop")

          var id = $location.path().substr(1); //no starting slash

          if(id) {
            attachPasty(editor, id).then(
              function(){
                d.resolve();
              },
              function(e){
                //something errored with this pasty
                console.log('Pasty ' + id + ' errored');

                if(e === "not found") {
                  console.log("Pasty " + id + " not found. Creating it...")
                  share.newPasty(id).then(
                    function(id) {
                      console.log("Pasty " + id + " created");
                      $location.path("/" + id);
                      d.resolve();
                    },
                    function(e) {
                      console.log("Server refused creating Pasty " + id)
                      clearLocation();
                      d.resolve();
                    });
                } else {
                  clearLocation();
                  d.resolve();
                }
              }
            );
          } else {
            console.log("Empty URL. Creating new Pasty...");
            share.newPasty().then(function(id) {
              console.log("Pasty " + id + " created");
              $location.path("/" + id);
              d.resolve();
            });
          }

          return d.promise;

        };

        var attachPasty = function(editor, id) {
          var d = $q.defer();
          
          console.log("Finding Pasty " + id + " ...");
          
          var pasty = share.findPasty(id).then(function(found){
            return $q(function(resolve,reject){
              if(found) {
                console.log("Pasty " + id + " found. Connecting...")
                resolve(share.connectPasty(id));
              }
              else {
                console.log("Pasty " + id + " not found.")
                reject('not found');
              }
            });
          }).then(function(socket) {

            var d = $q.defer();
            
            socket.on('change', function(data) {
              console.log("Pasty " + id + " changed on server");
              editor.setValue(data);
            });

            socket.on('disconnect', function() {
              //insert alert popup
              console.log('Pasty ' + id + ' disconnected');

              // only resolve on disconnect
              d.resolve();
            });

            editor.on('change', function(delta) {
              //no delta yet, just send everything
              
              if (editor.curOp && editor.curOp.command.name) {
                console.log('Editor changed');
                socket.emit('change', editor.getValue());
              }

            });

            var pathWatch = $scope.$watch(function(){ return $location.path(); }, function(newVal, oldVal){
              if(oldVal != newVal) {
                console.log("Location changed. Disconnecting from Pasty " + oldVal);
                share.disconnectPasty(socket);
                pathWatch(); // kill the watch, no need for it
                //Not sure if this needed here, but better resolve twice than none.
                d.resolve();
              }
            });

            console.log("Subscribed to Pasty " + id);

            return d.promise;
          });
          d.resolve(pasty);
          return d.promise;
        };

        $scope.aceOption = {
          onLoad: function (ace) {
            //changes from true to false to true to false.. etc
            var tick = true;


            // main loop, non-blocking
            $scope.$watch(function(){ return tick; }, function(){ 
              main(ace).then( function() { tick = !tick; } ); 
            });
          }
        };

      }],
      template: '<div ui-ace="aceOption"></div>'
    }
  });

})();