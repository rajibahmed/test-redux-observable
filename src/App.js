import React from "react";
import { compose } from "ramda";
import { createStore } from "redux";
import { Provider, connect, useSelector } from "react-redux";
import * as most from "most";
import {
  select,
  createEpicMiddleware,
  createStateStreamEnhancer
} from "redux-most";

const rootState = {
  counter: 10,
  users: []
};
//reducers
const userReducer = (state = rootState, action) => {
  switch (action.type) {
    case "UPDATE_USERS":
      return { ...state, users: action.payload };
    default:
      return state;
  }
};

//epics
export const usersEpic = (action$, store) => {
  return action$.thru(select("FETCH_USER_LOAD")).flatMap(action =>
    most
      .fromPromise(fetch("https://randomuser.me/api/?results=2"))
      .flatMap(d => most.fromPromise(d.json()))
      .flatMap(d => {
        return most.from([{ type: "UPDATE_USERS", payload: d.results }]);
      })
      .recoverWith(e => most.of({ type: "ERROR" }))
  );
};

const UserProfile = ({ user }) => {
  return (
    <>
      <div>
        <img src={user.picture.medium} alt={user.name.first} />
        <h1> {user.name.first}</h1>
      </div>
    </>
  );
};

//action
const fetchUser = () => {
  return { type: "FETCH_USER_LOAD" };
};

const mapStateToProps = (state, ownProps) => {
  return { count: state.counter };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchUser: () => dispatch(fetchUser())
  };
};

const User = props => {
  const users = useSelector(state => state.users);

  return (
    <>
      <div> User List {props.count} </div>
      <button onClick={props.fetchUser}>+++</button>
      {users && users.map(user => <UserProfile key={user.email} user={user} />)}
    </>
  );
};

const UserContainer = connect(mapStateToProps, mapDispatchToProps)(User);

function App() {
  return (
    <div className="App">
      <h1>This is Redux observable app</h1>
      <UserContainer />
    </div>
  );
}

// SETUP
const epicMiddleware = createEpicMiddleware(usersEpic);
const composeEnhancers =
  (typeof window !== "undefined" &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const storeEnhancers = composeEnhancers(
  createStateStreamEnhancer(epicMiddleware)
);

const store = createStore(userReducer, storeEnhancers);

export default () => (
  <Provider store={store}>
    <App />
  </Provider>
);
