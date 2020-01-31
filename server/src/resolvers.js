const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

module.exports = {
  Subscription: {
    messageAdded: {
      subscribe: () => pubsub.asyncIterator('messageAdded'),
    }
  },
  Mutation: {
    sendEvent: async (_, { type }) => {
      pubsub.publish('messageAdded', {
        messageAdded: {
          text: type,
        }
      });
      return 'success';
    },
  },
};
