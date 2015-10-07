/**
 * Module Dependencies
 */
var ldap = require('ldap');
var _ = require('lodash');

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
  
  // You may also want to store additional, private data
  // per-collection (esp. if your data store uses persistent
  // connections).
  //
  // Keep in mind that models can be configured to use different databases
  // within the same app, at the same time.
  // 
  // i.e. if you're writing a MariaDB adapter, you should be aware that one
  // model might be configured as `host="localhost"` and another might be using
  // `host="foo.com"` at the same time.  Same thing goes for user, database, 
  // password, or any other config.
  //
  // You don't have to support this feature right off the bat in your
  // adapter, but it ought to get done eventually.
  // 
  // Sounds annoying to deal with...
  // ...but it's not bad.  In each method, acquire a connection using the config
  // for the current model (looking it up from `_modelReferences`), establish
  // a connection, then tear it down before calling your method's callback.
  // Finally, as an optimization, you might use a db pool for each distinct
  // connection configuration, partioning pools for each separate configuration
  // for your adapter (i.e. worst case scenario is a pool for each model, best case
  // scenario is one single single pool.)  For many databases, any change to 
  // host OR database OR user OR password = separate pool.
  var _dbPools = {};

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
      
      _modelReferences = collections;

      var config = _.extend(this.defaults, connection);

      console.log(config);
      try {
        _connections[connection.identity] = ldap.createClient(config);
      } catch (e) {
        //TODO: this doesn't catch everything because LDAP throws something asynchronously somewhere slightly unusual
        e.message = e.message + '. There was a problem with the LDAP adapter config.';
        return cb(e);
      }

      cb();
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
      //TODO: unbind ALL dbPools here... in parallel..?
      cb && cb();
    },

    find: function(collectionName, options, cb) {

      // If you need to access your private data for this collection:
      var collection = _modelReferences[collectionName];

      // Options object is normalized for you:
      // 
      // options.where
      // options.limit
      // options.skip
      // options.sort
      
      // Filter, paginate, and sort records from the datastore.
      // You should end up w/ an array of objects as a result.
      // If no matches were found, this will be an empty array.

      // Respond with an error, or the results.
      cb(null, [{message: 'I got this far'}]);
    }


  };


  // Expose adapter definition
  return adapter;

})();

