const { ApolloServer, makeExecutableSchema } = require('apollo-server-express');
const { execute, subscribe } = require('graphql');
const express = require('express');
const cors = require('cors');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const app = express();
app.use('*', cors({ origin: 'http://georgy-clp-app.s3-website-us-west-2.amazonaws.com' }));

// Set up Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  uploads: false,
});

server.applyMiddleware({
  app
});

app.listen(4000, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
});

SubscriptionServer.create(
  {
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    execute,
    subscribe,
  },
  {
    server: app,
    path: '/graphql',
    port: 4001,
  },
);
