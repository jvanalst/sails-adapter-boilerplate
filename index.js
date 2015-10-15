/**
 * Module Dependencies
 */
var ldap = require('ldap');
var _ = require('lodash');
var Promise = require('bluebird');
/**
 * Sails Boilerplate Adapter
 *
 * Most of the methods below are optional.
 * 
 * If you don't need / can't get to every method, just implement
 * what you have time for.  The other methods will only fail if
 * you try to call them!
 * 
 * For many adapters, this file is all you need.  For very complex adapters, you may need more flexiblity.
 * In any case, it's probably a good idea to start with one file and refactor only if necessary.
 * If you do go that route, it's conventional in Node to create a `./lib` directory for your private submodules
 * and load them at the top of the file with other dependencies.  e.g. var update = `require('./lib/update')`;
 */
module.exports = (function () {


  // You'll want to maintain a reference to each collection
  // (aka model) that gets registered with this adapter.
  var _collectionReferences = {};
  var _connections = {};


  //TODO: Write This Methods since the connection pool doesn't work w/paging
  var _LDAPConnect = function (opts) {
    return new Promise(function (resolve, reject) {
      try {
        var connection = ldap.createClient(opts);
        connection.on('connect', function () {
          resolve(connection);
        });
        connection.on('connectError', function (e) {
          e.message = e.message + '. There was a problem with the LDAP adapter config.';
          reject(e);
        });
      }
      catch (e) {
        //TODO: this doesn't catch everything because LDAP throws something asynchronously somewhere slightly unusual
        e.message = e.message + '. There was a problem with the LDAP adapter config.';
        return reject(e);
      }
    });
  };

  // var _LDAPBind = function (connection, opts) {
  //   return new Promise(function (resolve, reject) {
  //     connection.bind(opts.dn, opts.password, opts.controls, function (e) {
  //       if (e) return reject(e);
  //       resolve(connection);
  //     });
  //   })
  // }

  var _LDAPUnbind = function (opts) {
    return new Promise(function (resolve, reject) {
      opts.unbind(function (e) {
        if (e) return reject(e);
        resolve();
      });
    })
  }

  var _LDAPSearch = function (opts) {
    return new Promise(function (resolve, reject) {
      var client = opts.client;
      var base = opts.base;
      var options = opts.options;

      return client.search(base, options, function (err, res) {
        if (err) return reject(err);

        var entries = [];

        res.on('searchEntry', function (entry) {
          return entries.push(entry);
        });
        res.on('error', function (err) {
          if (err) sails.log.warn(err);
        });
        res.on('end', function (result) {
          if (result.errorMessage) return reject(result.errorMessage);

          return resolve(entries);
        });
      });
    });
  };

  _generateFilter = function (key, value) {
  }

  var adapter = {

    // Set to true if this adapter supports (or requires) things like data types, validations, keys, etc.
    // If true, the schema for models using this adapter will be automatically synced when the server starts.
    // Not terribly relevant if your data store is not SQL/schemaful.
    syncable: false,

    // Default configuration for collections
    // (same effect as if these properties were included at the top level of the model definitions)
    defaults: {
      url: 'ldap://my.ldap.server',
      maxConnections: 1,
      // bindDN: 'cn=rootbeer',
      // bindCredentials: 'my-password'
    },


    /**
     * 
     * This method runs when a model is initially registered
     * at server-start-time.  This is the only required method.
     * 
     * @param  {[type]}   collection [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
    registerConnection: function(connection, collections, cb) {
      // Keep a reference to this collection
      if (!connection.identity) return cb(Errors.IdentityMissing);
      if (_connections[connection.identity]) return cb(Errors.IdentityDuplicate);
      
      _collectionReferences = collections;

      var config = _.extend(this.defaults, connection);

      //We can't use connection pools because of LDAP doesn't
      //support paging multiple queries on the same connection
      _connections[connection.identity] = config;

      return cb();
    },

    /**
     * Fired when a model is unregistered, typically when the server
     * is killed. Useful for tearing-down remaining open connections,
     * etc.
     * 
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    teardown: function(cb) {
      cb && cb();
    },

    find: function(connection, collectionName, options, cb) {
      console.log(connection);
      console.log(collectionName);
      console.log(options);
      console.log(cb);
      // If you need to access your private data for this collection:
      var collection = _collectionReferences[collectionName];

      // Options object is normalized for you:
      // 
      // options.where
      // options.limit
      // options.skip
      // options.sort
      
      // Filter, paginate, and sort records from the datastore.
      // You should end up w/ an array of objects as a result.
      // If no matches were found, this will be an empty array.

      //TODO: should we fake pagination since LDAP doesn't support it?
      //TODO: should we fake sorting since LDAP doesn't support it?
      //TODO: should we force people to specify scope sub/base/one in their models ???
      //TODO: write filter from options.where
      _LDAPConnect(_connections[connection]).then(function (connection) {
        return Promise.all([
          connection,
          _LDAPSearch({
            client: connection,
            base: collection.base,
            options: {
              scope: 'sub',
              filter: '(&(term=1530)(facultyCode=ED))',
              paged: true
            }
          })
        ]);
      }).spread(function (connection, result) {
        return Promise.all([
          result,
          _LDAPUnbind(connection)
        ]);
      }).spread(function (result) {
        //TODO: Support Binary Fields Here Somehow...
        cb(null, _.pluck(result, 'object'));
      }).catch(cb);
    }


  };


  // Expose adapter definition
  return adapter;

})();

