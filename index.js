( function ( $, Rlite, Please, IDBStore, sentimentAnalysis, d3, c3, WordCloud, prettySize ) {

    var HANGOUTS_TIMESTAMP_SCALAR = Math.pow( 10, 3 ),
        PHONE_NUMBER_REGEX = /^[\+\d{1,3}\-\s]*\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,

        // EMOJI_REGEX: https://github.com/mathiasbynens/emoji-regex
        EMOJI_REGEX = /\uD83C(?:\uDDE6\uD83C(?:\uDDEB|\uDDFD|\uDDF1|\uDDF8|\uDDE9|\uDDF4|\uDDEE|\uDDF6|\uDDEC|\uDDF7|\uDDF2|\uDDFC|\uDDE8|\uDDFA|\uDDF9|\uDDFF|\uDDEA)|\uDDE9\uD83C(?:\uDDFF|\uDDF0|\uDDEC|\uDDEF|\uDDF2|\uDDF4|\uDDEA)|\uDDE7\uD83C(?:\uDDF8|\uDDED|\uDDE9|\uDDE7|\uDDFE|\uDDEA|\uDDFF|\uDDEF|\uDDF2|\uDDF9|\uDDF4|\uDDE6|\uDDFC|\uDDFB|\uDDF7|\uDDF3|\uDDEC|\uDDEB|\uDDEE|\uDDF6|\uDDF1)|\uDDEE\uD83C(?:\uDDF4|\uDDE8|\uDDF8|\uDDF3|\uDDE9|\uDDF7|\uDDF6|\uDDEA|\uDDF2|\uDDF1|\uDDF9)|\uDDFB\uD83C(?:\uDDEC|\uDDE8|\uDDEE|\uDDFA|\uDDE6|\uDDEA|\uDDF3)|\uDDF0\uD83C(?:\uDDED|\uDDFE|\uDDF2|\uDDFF|\uDDEA|\uDDEE|\uDDFC|\uDDEC|\uDDF5|\uDDF7|\uDDF3)|\uDDE8\uD83C(?:\uDDF2|\uDDE6|\uDDFB|\uDDEB|\uDDF1|\uDDF3|\uDDFD|\uDDF5|\uDDE8|\uDDF4|\uDDEC|\uDDE9|\uDDF0|\uDDF7|\uDDEE|\uDDFA|\uDDFC|\uDDFE|\uDDFF|\uDDED)|\uDDEA\uD83C(?:\uDDE6|\uDDE8|\uDDEC|\uDDF7|\uDDEA|\uDDF9|\uDDFA|\uDDF8|\uDDED)|\uDDF9\uD83C(?:\uDDE9|\uDDEB|\uDDFC|\uDDEF|\uDDFF|\uDDED|\uDDF1|\uDDEC|\uDDF0|\uDDF4|\uDDF9|\uDDE6|\uDDF3|\uDDF7|\uDDF2|\uDDE8|\uDDFB)|\uDDED\uD83C(?:\uDDF7|\uDDF9|\uDDF2|\uDDF3|\uDDF0|\uDDFA)|\uDDF8\uD83C(?:\uDDFB|\uDDF2|\uDDF9|\uDDE6|\uDDF3|\uDDE8|\uDDF1|\uDDEC|\uDDFD|\uDDF0|\uDDEE|\uDDE7|\uDDF4|\uDDF8|\uDDED|\uDDE9|\uDDF7|\uDDEF|\uDDFF|\uDDEA|\uDDFE)|\uDDEC\uD83C(?:\uDDF6|\uDDEB|\uDDE6|\uDDF2|\uDDEA|\uDDED|\uDDEE|\uDDF7|\uDDF1|\uDDE9|\uDDF5|\uDDFA|\uDDF9|\uDDEC|\uDDF3|\uDDFC|\uDDFE|\uDDF8|\uDDE7)|\uDDEB\uD83C(?:\uDDF0|\uDDF4|\uDDEF|\uDDEE|\uDDF7|\uDDF2)|\uDDF5\uD83C(?:\uDDEB|\uDDF0|\uDDFC|\uDDF8|\uDDE6|\uDDEC|\uDDFE|\uDDEA|\uDDED|\uDDF3|\uDDF1|\uDDF9|\uDDF7|\uDDF2)|\uDDEF\uD83C(?:\uDDF2|\uDDF5|\uDDEA|\uDDF4)|\uDDFD\uD83C\uDDF0|\uDDF1\uD83C(?:\uDDE6|\uDDFB|\uDDE7|\uDDF8|\uDDF7|\uDDFE|\uDDEE|\uDDF9|\uDDFA|\uDDF0|\uDDE8)|\uDDF2\uD83C(?:\uDDF4|\uDDF0|\uDDEC|\uDDFC|\uDDFE|\uDDFB|\uDDF1|\uDDF9|\uDDED|\uDDF6|\uDDF7|\uDDFA|\uDDFD|\uDDE9|\uDDE8|\uDDF3|\uDDEA|\uDDF8|\uDDE6|\uDDFF|\uDDF2|\uDDF5|\uDDEB)|\uDDFE\uD83C(?:\uDDF9|\uDDEA)|\uDDF3\uD83C(?:\uDDE6|\uDDF7|\uDDF5|\uDDF1|\uDDE8|\uDDFF|\uDDEE|\uDDEA|\uDDEC|\uDDFA|\uDDEB|\uDDF4)|\uDDF4\uD83C\uDDF2|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C(?:\uDDEA|\uDDF4|\uDDFA|\uDDFC|\uDDF8)|\uDDFC\uD83C(?:\uDDF8|\uDDEB)|\uDDFF\uD83C(?:\uDDE6|\uDDF2|\uDDFC)|\uDDFA\uD83C(?:\uDDEC|\uDDE6|\uDDF8|\uDDFE|\uDDF2|\uDDFF))|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26F7-\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF30-\uDF35\uDF37-\uDF7C\uDF80-\uDF93\uDFA0-\uDFCA\uDFE0-\uDFF0\uDFF4]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDD00-\uDD3D\uDD50-\uDD67\uDD95\uDD96\uDDFB-\uDE42\uDE45-\uDE4F\uDE80-\uDEC5\uDECC\uDEEB\uDEEC]/g,
        // ASCII_REGEX, ASCII_LIST, converCodePointToCharacter: https://github.com/Ranks/emojione
        ASCII_REGEX = /(\<3|&lt;3|\<\/3|&lt;\/3|\:'\)|\:'\-\)|\:D|\:\-D|\=D|\:\)|\:\-\)|\=\]|\=\)|\:\]|'\:\)|'\:\-\)|'\=\)|'\:D|'\:\-D|'\=D|\>\:\)|&gt;\:\)|\>;\)|&gt;;\)|\>\:\-\)|&gt;\:\-\)|\>\=\)|&gt;\=\)|;\)|;\-\)|\*\-\)|\*\)|;\-\]|;\]|;D|;\^\)|'\:\(|'\:\-\(|'\=\(|\:\*|\:\-\*|\=\*|\:\^\*|\>\:P|&gt;\:P|X\-P|x\-p|\>\:\[|&gt;\:\[|\:\-\(|\:\(|\:\-\[|\:\[|\=\(|\>\:\(|&gt;\:\(|\>\:\-\(|&gt;\:\-\(|\:@|\:'\(|\:'\-\(|;\(|;\-\(|\>\.\<|&gt;\.&lt;|\:\$|\=\$|#\-\)|#\)|%\-\)|%\)|X\)|X\-\)|\*\\0\/\*|\\0\/|\*\\O\/\*|\\O\/|O\:\-\)|0\:\-3|0\:3|0\:\-\)|0\:\)|0;\^\)|O\:\-\)|O\:\)|O;\-\)|O\=\)|0;\-\)|O\:\-3|O\:3|B\-\)|B\)|8\)|8\-\)|B\-D|8\-D|\-_\-|\-__\-|\-___\-|\>\:\\|&gt;\:\\|\>\:\/|&gt;\:\/|\:\-\/|\:\-\.|\:\/|\:\\|\=\/|\=\\|\:L|\=L|\:P|\:\-P|\=P|\:\-p|\:p|\=p|\:\-Þ|\:\-&THORN;|\:Þ|\:&THORN;|\:þ|\:&thorn;|\:\-þ|\:\-&thorn;|\:\-b|\:b|d\:|\:\-O|\:O|\:\-o|\:o|O_O|\>\:O|&gt;\:O|\:\-X|\:X|\:\-#|\:#|\=X|\=x|\:x|\:\-x|\=#)/g,
        ASCII_LIST = {"<3":"2764","</3":"1f494",":')":"1f602",":'-)":"1f602",":D":"1f603",":-D":"1f603","=D":"1f603",":)":"1f604",":-)":"1f604","=]":"1f604","=)":"1f604",":]":"1f604","':)":"1f605","':-)":"1f605","'=)":"1f605","':D":"1f605","':-D":"1f605","'=D":"1f605",">:)":"1f606",">;)":"1f606",">:-)":"1f606",">=)":"1f606",";)":"1f609",";-)":"1f609","*-)":"1f609","*)":"1f609",";-]":"1f609",";]":"1f609",";D":"1f609",";^)":"1f609","':(":"1f613","':-(":"1f613","'=(":"1f613",":*":"1f618",":-*":"1f618","=*":"1f618",":^*":"1f618",">:P":"1f61c","X-P":"1f61c","x-p":"1f61c",">:[":"1f61e",":-(":"1f61e",":(":"1f61e",":-[":"1f61e",":[":"1f61e","=(":"1f61e",">:(":"1f620",">:-(":"1f620",":@":"1f620",":'(":"1f622",":'-(":"1f622",";(":"1f622",";-(":"1f622",">.<":"1f623",":$":"1f633","=$":"1f633","#-)":"1f635","#)":"1f635","%-)":"1f635","%)":"1f635","X)":"1f635","X-)":"1f635","*\\0/*":"1f646","\\0/":"1f646","*\\O/*":"1f646","\\O/":"1f646","O:-)":"1f607","0:-3":"1f607","0:3":"1f607","0:-)":"1f607","0:)":"1f607","0;^)":"1f607","O:)":"1f607","O;-)":"1f607","O=)":"1f607","0;-)":"1f607","O:-3":"1f607","O:3":"1f607","B-)":"1f60e","B)":"1f60e","8)":"1f60e","8-)":"1f60e","B-D":"1f60e","8-D":"1f60e","-_-":"1f611","-__-":"1f611","-___-":"1f611",">:\\":"1f615",">:/":"1f615",":-/":"1f615",":-.":"1f615",":/":"1f615",":\\":"1f615","=/":"1f615","=\\":"1f615",":L":"1f615","=L":"1f615",":P":"1f61b",":-P":"1f61b","=P":"1f61b",":-p":"1f61b",":p":"1f61b","=p":"1f61b",":-\u00de":"1f61b",":\u00de":"1f61b",":\u00fe":"1f61b",":-\u00fe":"1f61b",":-b":"1f61b",":b":"1f61b","d:":"1f61b",":-O":"1f62e",":O":"1f62e",":-o":"1f62e",":o":"1f62e",O_O:"1f62e",">:O":"1f62e",":-X":"1f636",":X":"1f636",":-#":"1f636",":#":"1f636","=X":"1f636","=x":"1f636",":x":"1f636",":-x":"1f636","=#":"1f636"},
        converCodePointToCharacter = function(a){if(-1<a.indexOf("-")){var e=[];a=a.split("-");for(var c=0;c<a.length;c++){var b=parseInt(a[c],16);if(65536<=b&&1114111>=b)var d=Math.floor((b-65536)/1024)+55296,b=(b-65536)%1024+56320,b=String.fromCharCode(d)+String.fromCharCode(b);else b=String.fromCharCode(b);e.push(b)}return e.join("")}a=parseInt(a,16);return 65536<=a&&1114111>=a?(d=Math.floor((a-65536)/1024)+55296,String.fromCharCode(d)+String.fromCharCode((a-65536)%1024+56320)):String.fromCharCode(a)};
        // EMOJI_SUPPORTED: https://gist.github.com/mwunsch/4710561
        EMOJI_SUPPORTED = (function(){var a;if(document.createElement("canvas").getContext&&(a=document.createElement("canvas").getContext("2d"),"function"==typeof a.fillText))return smile=String.fromCharCode(55357)+String.fromCharCode(56835),a.textBaseline="top",a.font="32px Arial",a.fillText(smile,0,0),0!==a.getImageData(16,16,1,1).data[0]}()),
        // generateUuid: http://stackoverflow.com/a/8809472

        generateUuid = function(){return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});},
        IS_DEV = window.location.search.indexOf( 'dev=true' ) !== -1,
        unnamedPersonCt = 0,
        hangoutsDatabase = new HangoutsDatabase();

    function Conversation ( id, timestamp ) {
        this.id = id;
        this.timestamp = timestamp;
        this.participants = new FastSet( null,
            function ( a, b ) {
                return a.gaiaId === b.gaiaId;
            }, function ( o ) {
                return o.gaiaId;
            } );
        this.events = new SortedArray( [], false, function ( a, b ) { return a.timestamp - b.timestamp; } );
    }

    function Event ( id, timestamp, senderId, message, attachments ) {
        this.id = id;
        this.timestamp = timestamp;
        this.senderId = senderId;
        this.message = message;
        this.attachments = attachments;
    }

    function Participant ( name, gaiaId, chatId ) {
        this.name = name || 'Unnamed #' + ( unnamedPersonCt++ );
        this.gaiaId = gaiaId;
        this.chatId = chatId;
    }

    function HangoutsDatabase () {
        var db = this;

        this._ready = $.Deferred();
        this.store = new IDBStore( {
            storeName: 'Hangouts',
            storePrefix: 'theopolisme-',
            dbVersion: 1,
            keyPath: null,
            indexes: [],
            onStoreReady: function () {
                db._ready.resolve( true );
            },
            onError: function ( error ) { throw error; }
        } );
    }

    HangoutsDatabase.prototype.put = function ( key, value ) {
        var db = this;
        this._ready.then( function () {
            db.store.put( key, value );
        } );
    };

    HangoutsDatabase.prototype.get = function ( key, cb ) {
        var db = this;
        this._ready.then( function () {
            db.store.get( key, cb );
        } );
    };

    HangoutsDatabase.prototype.clear = function () {
        var db = this;
        this._ready.then( function () {
            db.store.clear();
        } );
    };

    function status ( message, type ) {
        if ( $( '.toast' ).length ) {
            $( '.toast span' ).text( message );
        } else {
            toast( message, 6000 );
        }
        if ( type === 'e' ) {
            setTimeout( function () {
                setUp();
            }, 2000 );
        }
    }

    $.fn.showModal = function () {
        $( '#lean_overlay' ).fadeTo( 200, 0.5 );
        this
            .css( {
                'display': 'block',
                'position': 'fixed',
                'opacity': 0,
                'z-index': 11000,
                'left': '50%',
                'margin-left': -( this.outerWidth() / 2 ) + 'px',
                'top': '100px'
            } )
            .fadeTo( 200, 1 );
    };

    $.fn.hideModal = function () {
        this.fadeOut( 200 );
        $( '#lean_overlay').fadeOut( 200 );
    };

    function normalizePhoneNumber ( phoneNumber ) {
        if ( !PHONE_NUMBER_REGEX.test( phoneNumber ) ) {
            return false;
        }

        return phoneNumber.replace(
            PHONE_NUMBER_REGEX,
            '$1$2$3'
        );
    }

    function loadFile ( file, callback ) {
        var fileSize = prettySize( file.size ),
            reader = new FileReader();

        status( 'Preparing to import file (' + fileSize + ')...' );

        reader.onprogress = function ( e ) {
            var percentLoaded = Math.round( ( e.loaded / e.total ) * 100 );
            status( percentLoaded + '% of ' + fileSize + ' loaded...' );
        };

        reader.onerror = function () {
            status( 'Error reading file: ' + reader.error, 'e' );
        };

        reader.onload = function ( e ) {
            callback( e.target.result );
        };

        reader.readAsText( file );        
    }

    function parseConversationsFromIMessage ( raw ) {
        var data, record, conversationsObject, conversations;

        status( 'Parsing iMessage stuffs...' );

        conversationsObject = {};
        conversations = new FastSet( null,
            function ( a, b ) {
                return a.id === b.id;
            }, function ( o ) {
                return o.id;
            } );

        data = d3.tsv.parse( raw );
        data.forEach( function ( record ) {
            var name = record.is_from_me === '1' ? 'Me' : record.contact;

            if ( !conversationsObject[record.contact] ) {
                conversationsObject[record.contact] = new Conversation(
                    /* id */ generateUuid(),
                    /* timestamp */ record.date * 1000
                );
            }

            if ( !conversationsObject[record.contact].participants.has( { gaiaId: name } ) ) {
                conversationsObject[record.contact].participants.add(
                    new Participant(
                        /* name */ name,
                        /* gaiaId */ name
                    )
                );
            }

            conversationsObject[record.contact].events.push(
                new Event(
                    /* id */ record.ROWID,
                    /* timestamp */ record.date * 1000,
                    /* senderId */ { gaiaId: name },
                    /* message */ record.text
                )
            );
        } );

        Object.keys( conversationsObject ).forEach( function ( k ) {
            conversations.add( conversationsObject[k] );
        } );

        return conversations;
    }

    function parseConversationsFromJson ( data ) {
        var raw, totalConversations, conversations, i, j, k, l,
            conversation, conversationData, participantData, eventData,
            content, messagePieces, attachments, segment, attachment;
        
        status( 'Parsing JSON data...' );

        raw = JSON.parse( data );
        totalConversations = raw['conversation_state'].length;
        conversations = new FastSet( null,
            function ( a, b ) {
                return a.id === b.id;
            }, function ( o ) {
                return o.id;
            } );

        for ( index = 0; index < raw['conversation_state'].length; index++ ) {
            conversationData = raw['conversation_state'][index];

            conversation = new Conversation(
                    /* id */ conversationData['conversation_id']['id'],
                    /* timestamp */ conversationData['response_header']['current_server_time'] / HANGOUTS_TIMESTAMP_SCALAR
                );

            status( 'Processing conversation (' + index + ' / ' + totalConversations + ')...' );

            for ( i = 0; i < conversationData['conversation_state']['conversation']['participant_data'].length; i++ ) {
                participantData = conversationData['conversation_state']['conversation']['participant_data'][i];
                conversation.participants.add(
                    new Participant(
                        /* name */ participantData['fallback_name'],
                        /* gaiaId */ participantData['id']['gaia_id'],
                        /* chatId */ participantData['id']['chat_id']
                    )
                );
            }

            for ( j = 0; j < conversationData['conversation_state']['event'].length; j++ ) {
                eventData = conversationData['conversation_state']['event'][j];

                // FIXME: Process other types of hangout events?
                if ( !eventData['chat_message'] ) {
                    continue;
                }

                content = eventData['chat_message']['message_content'];
                messagePieces = [];
                attachments = [];

                if ( content['segment'] ) {
                    for ( k = 0; k < content['segment'].length; k++ ) {
                        segment = content['segment'][k];
                        if ( ['text', 'link'].indexOf( segment['type'].toLowerCase() ) !== -1 ) {
                            messagePieces.push( segment['text'] );
                        }
                    }
                }

                if ( content['attachment'] ) {
                    for ( l = 0; l < content['attachment'].length; l++ ) {
                        // Google+ photo attachment
                        attachment = content['attachment'][l];
                        if ( attachment['embed_item']['type'][0].toLowerCase() == 'plus_photo' ) {
                            attachments.push( attachment['embed_item']['embeds.PlusPhoto.plus_photo']['url'] );
                        }
                    }
                }

                conversation.events.push(
                    new Event(
                        /* id */ eventData['event_id'],
                        /* timestamp */ eventData['timestamp'] / HANGOUTS_TIMESTAMP_SCALAR,
                        /* senderId */ { gaiaId: eventData['sender_id']['gaia_id'], chatId: eventData['sender_id']['chat_id'] },
                        /* message */ messagePieces.join( ' ' ),
                        /* attachments */ attachments
                    )
                );
            }

            conversations.add( conversation );
        }

        return conversations;
    }

    function listenForDrop ( callback ) {
        $( document.body )
            .on( 'dragenter dragleave', function () {
                $( this ).toggleClass( 'dragged-file-over' );
            } )
            .on( 'drop', function ( e ) {
                e.preventDefault();
                $( this ).removeClass( 'dragged-file-over' );
                callback( e.originalEvent.dataTransfer.files[0] );
            } );
    }

    function setUp () {
        var $intro;

        window.location.hash = '#/welcome';

        // Stop the browser from auto-opening dropped files
        $( document ).on( 'dragenter dragover drop', function ( e ) { e.stopPropagation(); e.preventDefault(); } );

        // MODAL

        $intro = $( '#intro' );
        $intro.showModal();

        // Initialize the other modals as well
        $( '.modal-trigger' ).leanModal();

        listenForDrop( fileSelected );

        $( '#file' ).change( function () {
            fileSelected( this.files[0] );
        } );

        function fileSelected ( file ) {
            $intro.hideModal();
            $( document.body ).off( 'dragenter dragleave drop' );
            handleFile( file );
        }

        // NAVBAR
        
        $( '#resetLink' ).click( function () {
            $( window ).off( 'hashchange' );

            $( '#viewer' ).empty();
            $( '.loading' ).show();

            status( 'Resetting Hangouts Analyzer...' );

            hangoutsDatabase.clear();
            setTimeout( function () {
                window.location.reload();
            }, 1000 );
        } );

        // In dev mode, use previously cached conversation data if available
        if ( IS_DEV ) {
            hangoutsDatabase.get( 'conversationData', function ( conversationData ) {
                if ( conversationData ) {
                    $intro.hideModal();
                    $( document.body ).off( 'dragenter dragleave drop' );
                    handleData( conversationData );
                }
            } );
        }
    }

    function handleFile ( file ) {
        loadFile( file, function ( data ) {
            var kind;

            // EXPERIMENTAL: not for public consumption
            if ( file.name.indexOf( '.tsv' ) !== -1 ) {
                kind = 'imessage';
            }

            // If dev mode, cache conversation data so it doesn't need to be reloaded each time
            if ( IS_DEV && kind !== 'imessage' ) {
                hangoutsDatabase.put( 'conversationData', data );
            }

            handleData( data, kind );
        } );
    }

    function handleData ( data, kind ) {
        var conversations, viewer;

        try {
            if ( kind === 'imessage' ) {
                conversations = parseConversationsFromIMessage( data );
            } else {
                conversations = parseConversationsFromJson( data );
            }
            status( 'Conversations parsed successfully!' );
        } catch ( e ) {
            status( 'Error reading file: ' + e.message, 'e' );
            return;
        }

        viewer = new Viewer( $( '#viewer' ), conversations );
        window.viewer = viewer;

        $( '.loading' ).fadeOut();
    }

    function Viewer ( $container, conversations ) {
        this.$container = $container;
        this.conversations = conversations;
        this.view = '';

        this._conversationsTemplate = $( '#conversations-template' ).html();
        this._conversationTemplate = $( '#conversation-template' ).html();

        this.initRouter();
        this.checkParticipantNames();
    }

    Viewer.prototype.initRouter = function () {
        var viewer = this,
            router = new Rlite();

        viewer.router = router;

        // Redirect to conversations view by default
        router.add( '', function () {
            window.location.hash = '#/conversations';
        } );

        router.add( 'conversations', function () {
            viewer.load( 'main' );
        } );

        router.add( 'conversations/:id', function ( r ) {
            viewer.load( 'conversation', { id: r.params.id } );
        } );

        // Hash-based routing
        function processHash () {
            var hash = window.location.hash || '#/';
            router.run( hash.substr( 2 ) );
        }

        $( window ).on( 'hashchange', processHash );
        window.location.hash = '#/conversations';
        processHash();
    };

    Viewer.prototype.checkParticipantNames = function () {
        var viewer = this,
            noNames = 0;

        this.conversations.forEach( function ( conversation ) {
            conversation.participants.forEach( function ( participant ) {
                var phoneNumber = normalizePhoneNumber( participant.name );
                if ( phoneNumber ) {
                    var i, formatted = '(XXX) XXX-XXXX';

                    noNames++;
                    participant._normalizedPhone = phoneNumber;
                    
                    // Prettify the name while we're at it, just in case
                    for ( i = 0, l = phoneNumber.length; i < l; i++ ) {
                        formatted = formatted.replace( 'X', phoneNumber[i] );
                    }
                    participant.name = formatted;
                }
            } );
        } );
        viewer.router.run( 'conversations' );

        if ( noNames === 0 ) {
            return;
        }

        hangoutsDatabase.get( 'numbersToNames', function ( numbersToNames ) {

            function updateParticipants ( numbersToNames ) {
                viewer.conversations.forEach( function ( conversation ) {
                    conversation.participants.forEach( function ( participant ) {
                        if ( participant._normalizedPhone ) {
                            if ( numbersToNames[participant._normalizedPhone] ) {
                                participant.name = numbersToNames[participant._normalizedPhone];
                            }
                        }
                    } );
                } );

                // Refresh conversations
                viewer.router.run( 'conversations' );
                status( 'Participant names updated!' );
            }

            if ( numbersToNames ) {
                updateParticipants( numbersToNames );
            } else {
                setTimeout( function () {
                    $( '#noNames' ).text( noNames );
                    $( '#missingNames' ).showModal();
                    $( '#noThanksUpload' ).click( function () {
                        $( '#missingNames' ).hideModal();
                        $( document.body ).off( 'dragenter dragleave drop' );
                    } );
                }, 1000 );

                listenForDrop( fileSelected );
                $( '#contactFile' ).change( function () {
                    fileSelected( this.files[0] );
                } );

                function fileSelected ( file ) {
                    $( '#missingNames' ).hideModal();
                    $( document.body ).off( 'dragenter dragleave drop' );

                    loadFile( file, function ( raw ) {
                        var contacts = d3.csv.parse( raw ),
                            numbersToNames = {};

                        status( 'Updating participant names...' );

                        contacts.forEach( function ( contact ) {
                            function add ( phoneKey ) {
                                if ( contact[phoneKey] ) {
                                    contact[phoneKey].split( ' ::: ' ).forEach( function ( phoneNumber ) {
                                        numbersToNames[ normalizePhoneNumber( phoneNumber ) ] = contact['Name'];
                                    } );
                                }
                            }

                            if ( contact['Name'] ) {
                                add( 'Phone 1 - Value' );
                                add( 'Phone 2 - Value' );
                            }
                        } );

                        hangoutsDatabase.put( 'numbersToNames', numbersToNames );
                        updateParticipants( numbersToNames );
                    } );
                }
            }
        } );
    };

    Viewer.prototype.load = function ( view, data ) {
        var viewer = this,
            loaders = {
                main: function () {
                    var $conversations = $( viewer._conversationsTemplate );

                    document.title = 'Conversations | Hangouts Analyzer';

                    viewer.$container.empty().append( $conversations );
                    viewer.conversations.forEach( function ( conversation ) {
                        var people, ts, iso;

                        // No messages in the conversation :(
                        if ( !conversation.events.length ) {
                            return;
                        }

                        people = conversation.participants
                            .map( function ( participant ) { return participant.name; } )
                            .join( ', ' );

                        ts = conversation.events.array[conversation.events.length - 1].timestamp;
                        iso = ( new Date( ts ) ).toISOString();

                        $conversations.find( 'tbody' ).append(
                            $( '<tr>' ).append(
                                $( '<td>' ).append( $( '<a href="#/conversations/' + conversation.id + '">' )
                                    .text( people ) ),
                                $( '<td>' )
                                    .attr( 'data-text', ts )
                                    .append( $( '<span class="timeago">' )
                                        .attr( 'title', iso )
                                        .text( iso )
                                    ),
                                $( '<td>' )
                                    .text( d3.format( ',' )( conversation.events.length ) )
                            )
                        );
                    } );

                    $( 'span.timeago' ).timeago();
                    $conversations.find( 'table' ).tablesorter( {
                        sortList: [[1,1]]
                    } );
                },

                conversation: function ( data ) {
                    var handlers, hasRun, eventsByParticipant,
                        conversation = viewer.conversations.get( { id: data.id } ),
                        $conversation = $( viewer._conversationTemplate ),
                        peopleCt = 0,
                        people = conversation.participants
                            .map( function ( participant ) { return participant.name; } )
                            .join( ', ' );

                    document.title = people + ' | Hangouts Analyzer';

                    viewer.$container.empty().append( $conversation );

                    $( '#conversationTitle' ).text( people );

                    participantIdToName = {};
                    eventsByParticipant = {};
                    conversation.participants.forEach( function ( p ) {
                        participantIdToName[p.gaiaId] = p.name;
                        eventsByParticipant[p.gaiaId] = [];
                    } );

                    conversation.events.forEach( function ( e ) {
                        eventsByParticipant[e.senderId.gaiaId].push( e );
                    } );

                    function pieChart ( bindto, distro, options ) {
                        return c3.generate( $.extend( /* deep */ true, {
                            bindto: bindto,
                            data: {
                                columns: distro,
                                type : 'pie'
                            },
                            tooltip: {
                                format: {
                                    value: function ( value, ratio, id, index ) {
                                        return d3.format( '.2s' )( value ) + ' (' + d3.format( '.3p' )( ratio ) + ')';
                                    }
                                }
                            }
                        }, options || {} ) );
                    }

                    function makeCountByParticipantDateChart ( bindto, yValue ) {
                        var xs, columns, xCol, yCol, groups;

                        xs = {};
                        columns = [];
                        for ( participant in eventsByParticipant ) {
                            name = participantIdToName[participant];
                            yCol = [ name ];
                            xCol = [ name + '_x' ];
                            
                            groups = eventsByParticipant[participant].group( function ( e ) {
                                var date = new Date ( e.timestamp );
                                return date.toDateString();
                            } );

                            groups.forEach( function ( group ) {
                                xCol.push( new Date( group[0] ) );
                                yCol.push( yValue( group[1] ) );
                            } );

                            xs[yCol[0]] = xCol[0];
                            columns.push( xCol );
                            columns.push( yCol );
                        }

                        c3.generate( {
                            bindto: bindto,
                            data: {
                                xs: xs,
                                columns: columns,
                            },
                            point: {
                                show: false
                            },
                            axis: {
                                x: {
                                    type: 'timeseries',
                                    tick: {
                                        fit: true,
                                        format: '%Y-%m-%d'
                                    }
                                }
                            }
                        } );
                    }

                    function stats () {
                        $( '#messageFactoid' )
                            .css( 'background-color', Please.make_color( { golden: false, value: .5 } ) )
                            .append(
                                $( '<span class="white-text">' )
                                    .html( 'A total of <strong>' + d3.format( ',' )( conversation.events.length ) + '</strong> messages exchanged' )
                            );

                        function messageDistro () {
                            var distro = [];

                            conversation.participants.forEach( function ( participant ) {
                                distro.push( [
                                    participant.name,
                                    conversation.events.filter( function ( e ) { return e.senderId.gaiaId === participant.gaiaId; } ).length
                                ] );
                            } );

                            pieChart( '#messageDistro', distro );
                        }
                        messageDistro();

                        function characterDistro () {
                            var distro = [];

                            conversation.participants.forEach( function ( participant ) {
                                distro.push( [
                                    participant.name,
                                    conversation.events
                                        .filter( function ( e ) { return e.senderId.gaiaId === participant.gaiaId; } )
                                        .map( function ( e ) { return e.message.length; } )
                                        .sum()
                                ] );
                            } );

                            pieChart(  '#characterDistro', distro );
                        }
                        characterDistro();

                        function eventSendTime () {
                            var chart, day, hour, fParticipant, fDay, fHour, xCol, yCol, name, scale,
                                frequency = {}, fPartMap = {}, xs = {}, columns = [],
                                maxFrequency = 0,
                                DAYS = [ 'Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday', 'Sunday' ],
                                HOURS = [ '12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am',
                                    '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm' ];

                            // generate the day/hour matrix
                            conversation.participants.forEach( function ( participant ) {
                                frequency[participant.gaiaId] = {};
                                day = 0;
                                hour = 0;
                                while ( day < 7 ) {
                                    frequency[participant.gaiaId][day] = {};
                                    hour = 0;
                                    while ( hour < 24 ) {
                                        frequency[participant.gaiaId][day][hour] = 0;
                                        hour++;
                                    }
                                    day++;
                                }
                            } );

                            conversation.events.forEach( function ( event ) {
                                var date = new Date( event.timestamp );
                                frequency[event.senderId.gaiaId][6 - date.getDay()][date.getHours()] += 1;
                            } );

                            xs = {};
                            columns = [];
                            for ( fParticipant in frequency ) {
                                name = participantIdToName[fParticipant];
                                fPartMap[name] = fParticipant;
                                yCol = [ name ];
                                xCol = [ name + '_x' ];
                                for ( fDay in frequency[fParticipant] ) {
                                    for ( fHour in frequency[fParticipant][fDay] ) {
                                        if ( frequency[fParticipant][fDay][fHour] > maxFrequency ) {
                                            maxFrequency = frequency[fParticipant][fDay][fHour];
                                        }
                                        xCol.push( fHour );
                                        yCol.push( fDay );
                                    }
                                }
                                xs[yCol[0]] = xCol[0];
                                columns.push( xCol );
                                columns.push( yCol );
                            }

                            scale = d3.scale.sqrt()
                                .domain( [ 0, maxFrequency ] )
                                .range( [ 0, 25 ] );

                            c3.generate( {
                                bindto: '#eventSendTime',
                                data: {
                                    xs: xs,
                                    columns: columns,
                                    type: 'scatter'
                                },
                                point: {
                                    r: function ( d ) {
                                        return scale( frequency[fPartMap[d.id]][d.value][d.x] );
                                    },
                                    focus: {
                                        expand: {
                                            enabled: false
                                        }
                                    }
                                },
                                axis: {
                                    x: {
                                        tick: {
                                            format: function ( d ) {
                                                return HOURS[d];
                                            }
                                        }
                                    },
                                    y: {
                                        tick: {
                                            format: function ( d ) {
                                                return DAYS[d];
                                            }
                                        }
                                    }
                                },
                                tooltip: {
                                    contents: function ( dList, defaultTitleFormat, defaultValueFormat, color ) {
                                        var chart = this,
                                            d = dList[0],
                                            html = '<table class="c3-tooltip"><tbody><tr><th colspan="2">' +
                                                DAYS[d.value] + ', ' + HOURS[d.x] + '</th></tr>';

                                        $.each( fPartMap, function ( name, id ) {
                                            var freq = frequency[id][d.value][d.x];

                                            if ( freq === 0 ) {
                                                return;
                                            }

                                            html += '<tr class="c3-tooltip-name-' + name + '"><td class="name"><span style="background-color:' + chart.config.data_colors[name] + '"></span>' + name +
                                                '</td><td class="value">' + freq + '</td></tr>';
                                        } );

                                        html += '</tbody></table>';

                                        return html;
                                    }
                                }
                            } );
                        }
                        eventSendTime();

                        function initiatorEnderGraph () {
                            var i, set, 
                                events = conversation.events.array,
                                intervalGroups = [],
                                initiators = {},
                                enders = {},
                                initiatorsForGraph = [],
                                endersForGraph = [],
                                distro = [];

                            conversation.participants.forEach( function ( p ) {
                                initiators[p.gaiaId] = 0;
                                enders[p.gaiaId] = 0;
                            } );

                            i = 0;
                            while ( i < events.length ) {
                                set = [ events[i] ];
                                i++;
                                while ( i < events.length && events[i].timestamp - events[i-1].timestamp < 3600000 /* 1 hour */ ) {
                                    set.push( events[i] );
                                    i++;
                                }
                                intervalGroups.push( set );
                            }

                            intervalGroups
                                .forEach( function ( group ) {
                                    initiators[group[0].senderId.gaiaId]++;
                                    enders[group[group.length - 1].senderId.gaiaId]++;
                                } );

                            conversation.participants.forEach( function ( participant ) {
                                initiatorsForGraph.push( [
                                    participant.name,
                                    initiators[participant.gaiaId]
                                ] );
                                endersForGraph.push( [
                                    participant.name,
                                    enders[participant.gaiaId]
                                ] );
                            } );

                            pieChart( '#initiatorGraph', initiatorsForGraph );
                            pieChart( '#endersGraph', endersForGraph );
                        }
                        initiatorEnderGraph();

                        function messagesPerDay () {
                            makeCountByParticipantDateChart( '#messagesPerDay', function ( events ) {
                                return events.length;
                            } )
                        }
                        messagesPerDay();
                    }

                    function sentiment () {
                        function sentimentTime () {
                            var xs, columns, participant, xCol, yCol, groups;

                            xs = {};
                            columns = [];
                            for ( participant in eventsByParticipant ) {
                                name = participantIdToName[participant];
                                yCol = [ name ];
                                xCol = [ name + '_x' ];
                                
                                groups = eventsByParticipant[participant].group( function ( e ) {
                                    var date = new Date ( e.timestamp );
                                    date.setMinutes( 0 );
                                    date.setSeconds( 0 );
                                    date.setMilliseconds( 0 );
                                    return date.toISOString();
                                } );

                                groups.forEach( function ( group ) {
                                    xCol.push( new Date( group[0] ) );
                                    yCol.push( sentimentAnalysis( group[1].map( function ( e ) { return e.message } ).join( ' ' ) ).comparative );
                                } );

                                xs[yCol[0]] = xCol[0];
                                columns.push( xCol );
                                columns.push( yCol );
                            }

                            c3.generate({
                                bindto: '#sentimentGraph',
                                data: {
                                    xs: xs,
                                    columns: columns,
                                    type: 'spline'
                                },
                                axis: {
                                    x: {
                                        type: 'timeseries',
                                        tick: {
                                            fit: true,
                                            count: 5,
                                            format: '%m/%d/%Y'
                                        }
                                    },
                                    y: {
                                        tick: {
                                            format: d3.format( '.2f' )
                                        }
                                    }
                                },
                                point: {
                                    show: false
                                },
                                zoom: {
                                    enabled: true,
                                    rescale: true
                                }
                            } );
                        }
                        sentimentTime();
                    }

                    function emoji () {
                        $( '#emojiNotSupported' ).toggle( !EMOJI_SUPPORTED );

                        function removeRepeatedEmoji ( arr ) {
                            return arr.filter( function ( v, i ) {
                                return i === 0 || v !== arr[i-1];
                            } );
                        }

                        function getEmoticons ( raw ) {
                            matched = raw.match( EMOJI_REGEX ) || [];

                            // Also include ASCII emoticons converted to their unicode equivalents
                            ( raw.match( ASCII_REGEX ) || [] ).forEach( function ( match ) {
                                if ( ASCII_LIST[match] ) {
                                    matched.push( converCodePointToCharacter( ASCII_LIST[match] ) );
                                }
                            } );

                            return removeRepeatedEmoji( matched );
                        }

                        makeCountByParticipantDateChart( '#emojiUsage', function ( events ) {
                            var raw = events.map( function ( e ) { return e.message; } ).join( ' ' );
                            return removeRepeatedEmoji( getEmoticons( raw ) ).length;
                        } );

                        function makeEmojiFrequency () {
                            var participant, $container, raw, matches, counts, currentEmoji, distro,
                                getColor = d3.scale.category20();

                            for ( participant in eventsByParticipant ) {
                                id = 'emojiFrequency_' + generateUuid(),
                                $container = $( '<div class="col s12 m6">' )
                                    .appendTo( '#emojiFrequency_byParticipant' )
                                    .append( $( '<h6>' ).text( participantIdToName[participant] ) ),
                                $chart = $( '<div>' ).attr( 'id', id ).appendTo( $container );

                                counts = new Dict( null, function () { return 0; } );
                                raw = eventsByParticipant[participant]
                                    .map( function ( e ) { return e.message; } )
                                    .join( ' ' );
                                matches = getEmoticons( raw );

                                if ( matches.length ) {
                                    matches.forEach( function ( matched ) {
                                        var emoji = matched.substring( 0 ); // if multiple matched in sequence
                                        counts.set( emoji, counts.get( emoji ) + 1 );
                                    } );

                                    distro = counts
                                        .map( function ( count, emoji ) { return [ emoji, count ] } )
                                        // only top 10
                                        .sorted( function ( a, b ) { return b[1] - a[1] } )
                                        .slice( 0, 10 );

                                    pieChart( '#' + id, distro, {
                                        data: {
                                            // so both graphs have consistent colors!
                                            color: function ( c, d ) { return getColor( typeof d === 'object' ? d.id : d ); }
                                        },
                                        pie: {
                                            label: {
                                                threshold: 0,
                                                format: function ( value, ratio, id ) {
                                                    return id;
                                                }
                                            }
                                        },
                                        legend: {
                                            show: false
                                        }
                                    } );
                                } else {
                                    $( '#' + id ).append( $( '<span>' ).addClass( 'no-emoji' ).text( 'No emoji :(' ) );
                                }
                            }
                        }
                        makeEmojiFrequency();
                    }

                    function content () {

                        function makeWordCloud ( $container, events ) {
                            var words,
                                cases = {},
                                $canvas = $container.find( 'canvas' ),
                                scaleFactor = window.devicePixelRatio || 1,
                                counts = new Dict( null, function () { return 0; } ),
                                stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;


                            $canvas.css( {
                                width: $container[0].offsetWidth,
                                height: $container[0].offsetHeight
                            } );

                            $canvas[0].width = $container[0].offsetWidth * scaleFactor;
                            $canvas[0].height = $container[0].offsetHeight * scaleFactor;

                            words = events
                                .map( function ( e ) {
                                    return e.message.match( /[\'\w\-]+/g ) || [];
                                } )
                                .flatten();
                            
                            words.forEach( function ( word ) {
                                var lowercased = word.toLowerCase();
                                if ( word && word.length > 2 && !stopWords.test( lowercased ) ) {
                                    cases[lowercased] = word;
                                    counts.set( lowercased, counts.get( lowercased ) + 1 );
                                }
                            } );

                            WordCloud( $canvas[0], {
                                list: counts
                                    .map( function ( count, word ) { return [ cases[word], count ]; } )
                                    // only top 1000 to stop it from rendering forever
                                    .sorted( function ( a, b ) { return b[1] - a[1] } )
                                    .slice( 0, 1000 ),
                                weightFactor: d3.scale.linear()
                                    .domain( [ 0, counts.max() ] )
                                    .range( [ 5 * scaleFactor, 100 * scaleFactor ] ),
                                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                                rotateRatio: 0.5
                            } );
                        }


                        function makeParticipantClouds () {
                            var participant, $container, $cloud;
                            for ( participant in eventsByParticipant ) {
                                $container = $( '<div class="col s12 m6">' )
                                    .appendTo( '#wordCloud_byParticipant' )
                                    .append( $( '<h6>' ).text( participantIdToName[participant] ) );
                                $cloud = $( '<div class="word-cloud">' )
                                    .appendTo( $container )
                                    .append( '<canvas>' );
                                makeWordCloud( $cloud, eventsByParticipant[participant] );
                            }
                        }

                        makeWordCloud( $( '#wordCloud_allEvents' ), conversation.events );
                        makeParticipantClouds();
                    }

                    function more () {
                        $( '#csvDownload' ).click( function () {
                            var csv = d3.csv.format(
                                    conversation.events.map( function ( e ) {
                                        return {
                                            sender: participantIdToName[e.senderId.gaiaId],
                                            time: new Date( e.timestamp ),
                                            message: e.message
                                        }
                                    } )
                                );

                            this.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent( csv );
                            this.download = ( conversation.participants
                                .map( function ( p ) { return p.name; } )
                                .join( '' )
                                .replace( /\s*/g, '' ) ).substring( 0, 10 ) + '_' + conversation.id.substring( 0, 5 ) + '.csv';
                        } );
                    }

                    // Just-in-time loading to make everything zippier

                    handlers = {
                        stats: stats,
                        sentiment: sentiment,
                        emoji: emoji,
                        conversationContent: content,
                        more: more
                    };
                    hasRun = {};

                    $conversation.find( 'ul.tabs' )
                        .tabs()
                        .on( 'click', 'a', function () {
                            var name = this.href.split( '#' ).pop();

                            if ( hasRun[name] ) {
                                return;
                            }

                            handlers[name]();
                            hasRun[name] = true;
                        } );

                    handlers.stats();
                    hasRun.stats = true;
                }
            },
        unloaders = {
            conversation: function () {
                // Abort current in-progress WordClouds
                $( document ).find( 'canvas' ).one( 'wordclouddrawn', function () {
                    return false;
                } );
            }
        };

        if ( !loaders[view] ) {
            return;
        }

        $( '.loading' ).show();

        // call the unloaders for the current view first
        if ( unloaders[this.view] ) {
            unloaders[this.view]();
        }

        this.view = view;

        setTimeout( function () {
            $( document ).scrollTop( 0 );
            loaders[view]( data );
            $( '.loading' ).fadeOut();
        }, 0 );
    };

    setUp();

}( jQuery, Rlite, Please, IDBStore, sentimentAnalysis, d3, c3, WordCloud, prettySize ) );
