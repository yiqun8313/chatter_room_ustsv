import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import socketIOClient from "socket.io-client";

const socket = socketIOClient("http://localhost:5000");

const ChatList = props => {
  let first = props.data.split(" ")[0];
  if (first === "SERVER:") {
    return <li className="li-server">{props.data}</li>;
  } else if (first === "You:") {
    return <li>{props.data}</li>;
  }
  return <li className="li-else">{props.data}</li>;
};

const RoomList = props => {
  return <li className="room-li">{props.data}</li>;
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chat: [],
      input: "",
      name: "",
      rooms: [],
      room: ""
    };
  }

  componentDidMount() {
    socket.emit("login");

    socket.on("loginSuccess", res => {
      this.setState({
        name: res.userName,
        chat: [...this.state.chat, `SERVER: You are known as ${res.userName}`],
        rooms: res.rooms,
        room: res.room
      });
    });

    socket.on("updateChat", (name, message) => {
      this.setState({ chat: [...this.state.chat, `${name}: ${message}`] });
    });

    socket.on("updateRooms", rooms => {
      this.setState({ rooms: rooms });
    });
  }

  inputHandler = e => {
    this.setState({ input: e.target.value });
  };

  submitHandler = e => {
    e.preventDefault();
    let array = this.state.input.split(" ");
    if (array[0] === "/change") {
      let newName = this.state.input.slice(6);
      socket.emit("changeName", this.state.name, newName, this.state.room);
      this.setState({ name: newName });
    } else if (array[0] === "/join") {
      let newRoom = this.state.input.slice(6);
      socket.emit("changeRoom", this.state.room, newRoom, this.state.name);
      this.setState({ room: newRoom });
    } else {
      socket.emit(
        "sendChat",
        this.state.name,
        this.state.input,
        this.state.room
      );
    }

    this.setState({ input: "" });
  };

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "instant" });
  };
  componentDidUpdate() {
    this.scrollToBottom();
  }

  render() {
    console.log(this.state.room);
    return (
      <div className="App">
        <h1>Chris Room</h1>
        <div className="room-title">Current Room: {this.state.room}</div>
        <div className="chat-mid">
          <div className="chat-content">
            <ul>
              {this.state.chat.map(chat => {
                return <ChatList data={chat} />;
              })}
            </ul>
            <div
              style={{ float: "left", clear: "both" }}
              ref={el => {
                this.messagesEnd = el;
              }}
            />
          </div>
          <div className="room-wrapper">
            <h3>Room List</h3>
            <div className="room-list">
              {this.state.rooms.map(room => {
                return <RoomList data={room} />;
              })}
            </div>
          </div>
        </div>
        <form onSubmit={this.submitHandler}>
          <input
            className="chat-input"
            onChange={this.inputHandler}
            value={this.state.input}
          />
          <button type="submit">send</button>
        </form>
        <div className="guide">
          <p>Chat commands:</p>
          <li>Change nickname: /change [username]</li>
          <li>Join/Create: /join [room name]</li>
        </div>
      </div>
    );
  }
}

export default App;
