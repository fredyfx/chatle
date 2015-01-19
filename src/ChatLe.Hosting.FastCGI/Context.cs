﻿using Microsoft.AspNet.HttpFeature;
using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.IO;
using System.Net.Sockets;
using Microsoft.Framework.Logging;

namespace ChatLe.Hosting.FastCGI
{
    public class Context : IHttpRequestFeature, IHttpResponseFeature
    {
        public byte Version { get; private set; }
        public ushort Id { get; private set; }

        public bool KeepAlive { get; set; }

        public State State { get; private set; }

        public bool Called { get; set; }
        public Context(byte version, ushort id, bool keepAlive, State state)
        {
            Version = version;
            Id = id;
            KeepAlive = keepAlive;
            State = state;
            ((IHttpResponseFeature)this).Body = new ResponseStream(this);
        }

        Stream IHttpRequestFeature.Body { get; set; } = new RequestStream();

        IDictionary<string, string[]> IHttpRequestFeature.Headers { get; set; } = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        string IHttpRequestFeature.Method
        {
            get;
            set;
        }

        string IHttpRequestFeature.Path
        {
            get;
            set;
        }

        string IHttpRequestFeature.PathBase
        {
            get;
            set;
        }

        string IHttpRequestFeature.Protocol { get; set; } = "http";

        string IHttpRequestFeature.QueryString
        {
            get;
            set;
        }

        string IHttpRequestFeature.Scheme
        {
            get;
            set;
        }

        int IHttpResponseFeature.StatusCode { get; set; }

        string IHttpResponseFeature.ReasonPhrase { get; set; }

        IDictionary<string, string[]> IHttpResponseFeature.Headers { get; set; } = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        Stream IHttpResponseFeature.Body { get; set; }

        BlockingCollection<KeyValuePair<Action<object>, object>> _sendingHeaders = new BlockingCollection<KeyValuePair<Action<object>, object>>();
        void IHttpResponseFeature.OnSendingHeaders(Action<object> callback, object state)
        {
            _sendingHeaders.Add(new KeyValuePair<Action<object>, object>(callback, state));
        }

        internal void HeaderSent()
        {
            foreach (var kv in _sendingHeaders)
                kv.Key.Invoke(kv.Value);
        }
    }
}