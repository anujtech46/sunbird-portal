const cassandra = require('../../cassandra-connection')()
const tableName = 'instructor'
let instructorModel;


module.exports = function() {
  if (instructorModel) {
    return cassandra.instance[tableName]
  } else {
    instructorModel = cassandra.loadSchema(tableName, {
      fields: {
        id: "text",
        courseId: "text",
        instructors: {
          type: "list",
          typeDef: "<text>"
        },
        batchId: "text",
        createdAt: "timestamp",
        updatedAt: "timestamp"
      },
      key: ["id"]
    });
    
    instructorModel.syncDB(function (err, result) {
      if (err) throw err;
    });
    return cassandra.instance[tableName]
  }
};
