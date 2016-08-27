﻿import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";  

import { Settings } from './settings';
import { User } from './user';
import { Message } from './message';
import { Conversation } from './conversation';

interface ChatSignalR extends SignalR {
    chat: ChatProxy
}

interface ChatProxy {
    client: ChatClient
}

interface ChatClient {
    userConnected(user: User): void;
    userDisconnected(id: string): void;
    messageReceived(message: Message): void;
    joinConversation(conversation: Conversation): void;
}

export enum ConnectionState {  
    Connected = 1,
    Disconnected = 2,
    Error = 3
}

@Injectable()
export class ChatService {

    connectionState: Observable<ConnectionState>;
    userConnected: Observable<User>;
    userDiscconnected: Observable<string>;
    messageReceived: Observable<Message>;
    joinConversation: Observable<Conversation>;
    
    private connectionStateSubject: Subject<ConnectionState>;
    private userConnectedSubject: Subject<User>;
    private userDisconnectedSubject: Subject<string>;
    private messageReceivedSubject: Subject<Message>;
    private joinConversationSubject: Subject<Conversation>;
    
    constructor(private settings: Settings, private http: Http) {
        this.connectionState = this.connectionStateSubject.asObservable();
        this.messageReceived = this.messageReceivedSubject.asObservable();
        this.userConnected = this.userConnectedSubject.asObservable();
        this.userDiscconnected = this.userDisconnectedSubject.asObservable();
        this.joinConversation = this.joinConversationSubject.asObservable();
    }
    
    start(debug: boolean):Observable<ConnectionState> {
        // only for debug
        $.connection.hub.logging = debug;
        // get the signalR hub named 'chat'
        let connection = <ChatSignalR>$.connection;
        let chatHub = connection.chat;
        
        /**
          * @desc callback when a new user connect to the chat
          * @param User user, the connected user
        */
        chatHub.client.userConnected = this.onUserConnected;
        /**
          * @desc callback when a new user disconnect the chat
          * @param id, the disconnected user id
        */
        chatHub.client.userDisconnected = this.onUserDisconnected;
        /**
          * @desc callback when a message is received
          * @param String to, the conversation id
          * @param Message data, the message
        */
        chatHub.client.messageReceived = this.onMessageReceived;
        /**
          * @desc callback when a new conversation is create on server
          * @param Conv data, the conversation model
        */
        chatHub.client.joinConversation = this.onJoinConversation

        if (debug) {
            // for debug only, callback on connection state change
            $.connection.hub.stateChanged(function (change) {
                let oldState: string,
                    newState: string;

                for (var state in $.signalR.connectionState) {
                    if ($.signalR.connectionState[state] === change.oldState) {
                        oldState = state;
                    }
                    if ($.signalR.connectionState[state] === change.newState) {
                        newState = state;
                    }
                }

                console.log("Chat Hub state changed from " + oldState + " to " + newState);
            });
            // for debug only, callback on connection reconnect
            $.connection.hub.reconnected(this.onReconnected);
        }
        // callback on connection error
        $.connection.hub.error(this.onError);
        // callback on connection disconnect
        $.connection.hub.disconnected(this.onDisconnected);

        // start the connection
        $.connection.hub.start()
            .done(response => this.connectionStateSubject.next(ConnectionState.Connected))
            .fail(response => this.connectionStateSubject.error(ConnectionState.Error));

        return this.connectionState;
    };
    
    private onReconnected() {
        this.connectionStateSubject.next(ConnectionState.Connected);
    }

    private onDisconnected() {
        this.connectionStateSubject.next(ConnectionState.Disconnected);
    }

    private onError() {
        this.connectionStateSubject.error(ConnectionState.Error);
    }

    private onUserConnected(user: User) {
        console.log("Chat Hub newUserConnected " + user.id);
        this.userConnectedSubject.next(user);             
    }

    private onUserDisconnected(id: string) {
        console.log("Chat Hub newUserConnected " + id);
        this.userDisconnectedSubject.next(id);             
    }   

    private onMessageReceived(message: Message) {
        this.messageReceivedSubject.next(message);
    }

    private onJoinConversation(conversation: Conversation) {
        this.joinConversationSubject.next(conversation);
    }

}