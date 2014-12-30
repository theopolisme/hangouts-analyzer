( function ( $, Rlite, Please, IDBStore, sentimentAnalysis, d3, c3, WordCloud, prettySize ) {

    var TIMESTAMP_SCALAR = Math.pow( 10, 3 ),
        PHONE_NUMBER_REGEX = /^[\+\d{1,3}\-\s]*\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
        IS_DEV = window.location.search.indexOf( 'dev=true' ) !== -1,
        unnamedPersonCt = 0,
        hangoutsDatabase = new HangoutsDatabase();

    function Conversation ( id, timestamp ) {
        this.id = id;
        this.timestamp = timestamp / TIMESTAMP_SCALAR;
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
        this.timestamp = timestamp / TIMESTAMP_SCALAR;
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
                    /* timestamp */ conversationData['response_header']['current_server_time']
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
                        /* timestamp */ eventData['timestamp'],
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

            // If dev mode, cache conversation data so it doesn't need to be reloaded each time
            if ( IS_DEV ) {
                hangoutsDatabase.put( 'conversationData', data );
            }

            handleData( data );
        } );
    }

    function handleData ( data ) {
        var conversations, viewer;

        try {
            conversations = parseConversationsFromJson( data );
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
                    var eventsByParticipant,
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

                    function pieChart ( bindto, distro ) {
                        return c3.generate( {
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
                                    yCol.push( group[1].length );
                                } );

                                xs[yCol[0]] = xCol[0];
                                columns.push( xCol );
                                columns.push( yCol );
                            }

                            c3.generate( {
                                bindto: '#messagesPerDay',
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
                                list: counts.map( function ( count, word ) { return [ cases[word], count ]; } ),
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

                    stats();
                    sentiment();
                    content();
                    more();

                    $conversation.find( 'ul.tabs' ).tabs();
                }
            };

        if ( !loaders[view] ) {
            return;
        }

        $( '.loading' ).show();

        this.view = view;

        setTimeout( function () {
            $( document ).scrollTop( 0 );
            loaders[view]( data );
            $( '.loading' ).fadeOut();
        }, 0 );
    };

    setUp();

}( jQuery, Rlite, Please, IDBStore, sentimentAnalysis, d3, c3, WordCloud, prettySize ) );
