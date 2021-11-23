const {buildSchema} = require('graphql');
const genericValidation = require('./middlewares/validation')
const schema = buildSchema(`
  type Query {
    hello: String,
    roll(num: Int!): String
  }
  type GenericMessage{
  message: String
  }
  type Mutation {
  updatePassword(oldPassword: String!, password: String!, confirmPassword: String!): GenericMessage
}
input MessageInput {
  content: String
  author: String
}
`);


const root = {
    updatePassword: async (args, req) => {
        await genericValidation('updatePasswordSchema', args);
        return {message: "updated"}
    }
};
module.exports = {schema, root};