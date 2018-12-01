const ExpressCassandra = require('express-cassandra');
const envHelper = require('./helpers/environmentVariablesHelper.js')
let cassandraCP = envHelper.PORTAL_CASSANDRA_URLS
let cassandraConnection;

module.exports = function () {
    if (cassandraConnection) {
        return cassandraConnection;
    } else {
        cassandraConnection = ExpressCassandra.createClient({
            clientOptions: {
                contactPoints: cassandraCP,
                protocolOptions: { port: 9042 },
                keyspace: 'portal',
                queryOptions: { consistency: ExpressCassandra.consistencies.one }
            },
            ormOptions: {
                defaultReplicationStrategy: {
                    class: 'SimpleStrategy',
                    replication_factor: 1
                },
                migration: 'safe',
            }
        });
        return cassandraConnection;
    }
}