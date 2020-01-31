const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    hello: String!
  }

  type Mutation {
    sendEvent(type: String): String
  }

  type Subscription {
    messageAdded: Message
  }

  type Message {
    text: String
  }
`;

module.exports = typeDefs;
