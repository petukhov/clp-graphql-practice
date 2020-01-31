import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import gql from 'graphql-tag';
import { WebSocketLink } from 'apollo-link-ws';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';
import { ApolloProvider, useMutation, useApolloClient } from '@apollo/react-hooks';
import { Router, RouteComponentProps } from '@reach/router';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

import './styles.css';

const wsLink = new WebSocketLink({
  uri: 'ws://awseb-e-a-awsebloa-1wao92um49lxn-981737877.us-west-2.elb.amazonaws.com:4001/graphql',
  options: {
    reconnect: true
  }
});

const httpLink = new HttpLink({
  uri: 'http://awseb-e-a-awsebloa-1wao92um49lxn-981737877.us-west-2.elb.amazonaws.com/graphql',
});

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const cache = new InMemoryCache();
const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  cache,
  link,
});


const MESSAGE_SUBSCRIPTION = gql`
  subscription messageAdded {
    messageAdded {
      text
    }
  }
`;

const SEND_EVENT = gql`
  mutation sendEvent($type: String!) {
    sendEvent(type: $type)
  }
`;

const defaultChartData: any = [];
for (let i = 0; i <= 5; i += 0.5) {
  defaultChartData.push(
    {time: i, orange: 0, blue: 0, black: 0},
  );
}

const Dashboard: React.FC<RouteComponentProps> = () => {
  const client = useApolloClient();
  const [decCount, setDecCount] = useState(0);
  const [incCount, setIncCount] = useState(0);
  const [chartData, setChartData] = useState(defaultChartData);
  const dataPoints = useRef([] as any);
  const graphqlSubscription = useRef(null as any);
  const useEffectCount = useRef(0);

  useEffect(() => {
    graphqlSubscription.current = client.subscribe({
      query: MESSAGE_SUBSCRIPTION,
    }).subscribe({
      next({data}) {
        const type = data.messageAdded.text;
        if (type === 'inc') {
          setIncCount(c => c + 1);
        } else if (type === 'dec') {
          setDecCount(c => c + 1);
        }
      },
      error(err) { console.error('err', err); },
    })
    return () => graphqlSubscription.current.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (useEffectCount.current === 1) {
      const arr = dataPoints.current;
      arr.push({time: 0, orange: 0, blue: 0, black: 0});
      const intervalId = setInterval(() => {
        const lastTime = arr[arr.length - 1].time;
        arr.push({time: lastTime + 0.5, orange: 0, blue: 0, black: 0});
      }, 500);
      setTimeout(() => {
        clearInterval(intervalId);
        graphqlSubscription.current.unsubscribe();
        setChartData(arr);
      }, 5000);
    }
    useEffectCount.current++;
  }, [decCount, incCount]);

  useEffect(() => {
    const arr = dataPoints.current;
    const lastDataPoint = arr[arr.length - 1];
    if (!lastDataPoint) {
      return;
    }
    lastDataPoint.orange++;
    lastDataPoint.black--;
  }, [decCount]);

  useEffect(() => {
    const arr = dataPoints.current;
    const lastDataPoint = arr[arr.length - 1];
    if (!lastDataPoint) {
      return;
    }
    lastDataPoint.blue++;
    lastDataPoint.black++;
  }, [incCount]);

  return (
    <div className="container">
      <div className="row">
        <LineChart className="center" width={800} height={400} data={chartData}>
          <Line type="monotone" dataKey="orange" stroke="#ff9559" strokeWidth={2} />
          <Line type="monotone" dataKey="blue" stroke="#007aff" strokeWidth={2} />
          <Line type="monotone" dataKey="black" stroke="#000000" strokeWidth={3} />
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5"/>
          <XAxis dataKey="time" label={{ value: 'Seconds(s)', position: 'insideBottom', offset: -4 }} />
          <YAxis label={{ value: 'Click(s)', angle: -90, position: 'insideLeft', offset: 30 }} />
          <Tooltip />
        </LineChart>  
      </div>
      <div className="row">
        <div className="label leftObj orange">{decCount}</div>
        <div className="label rightObj blue">{incCount}</div>
      </div>
    </div>
  );
}

const Client: React.FC<RouteComponentProps> = () => {
  const [sendEvent] = useMutation(
    SEND_EVENT,
  );
  function handleMinusClick() {
    sendEvent({variables: {type: 'dec'}});
  }
  function handlePlusClick() {
    sendEvent({variables: {type: 'inc'}});
  }
  return <div className="row">
    <button className="round leftObj orange" onClick={handleMinusClick}>-</button>
    <button className="round rightObj blue" onClick={handlePlusClick}>+</button>
  </div>;
}

ReactDOM.render(
  <ApolloProvider client={client}>
    <Router>
      <Dashboard path="/dashboard" />
      <Client path="/client" />
    </Router>
  </ApolloProvider>,
  document.getElementById('root'),
);
