/**
 * External dependencies
 */
var React = require( 'react' ),
	isFunction = require( 'lodash/lang/isFunction' ),
	classNames = require( 'classnames' );

/**
 * Internal dependencies
 */
var DocService = require( './service' ),
	Search = require( 'components/search' );

var DEFAULT_FILES = [
		'docs/guide/index.md',
		'README.md',
		'CONTRIBUTING.md',
		'docs/coding-guidelines.md',
		'client/lib/mixins/i18n/README.md',
		'docs/coding-guidelines/javascript.md',
		'docs/coding-guidelines/css.md',
		'docs/coding-guidelines/html.md'
	];

module.exports = React.createClass( {
	displayName: 'Devdocs',
	propTypes: {
		term: React.PropTypes.string
	},

	getDefaultProps: function() {
		return {
			term: ''
		};
	},

	getInitialState: function() {
		return {
			term: this.props.term,
			results: [],
			defaultResults: [],
			inputValue: '',
			searching: false
		};
	},

	// load default files if not already cached
	loadDefaultFiles: function() {
		if ( this.state.defaultResults.length ) {
			return;
		}

		DocService.list( DEFAULT_FILES, function( err, results ) {
			if ( !err && this.isMounted() ) {
				this.setState( {
					defaultResults: results
				} );
			}
		}.bind( this ) );
	},

	componentDidMount: function() {
		var term = this.state.term;
		this.loadDefaultFiles();
		if ( ! term ) {
			return;
		}
		this.onSearchChange( this.state.term );
		this.onSearch( this.state.term );
	},

	componentDidUpdate: function() {
		if ( isFunction( this.props.onSearchChange ) ) {
			this.props.onSearchChange( this.state.term );
		}
	},

	notFound: function() {
		return this.state.inputValue && this.state.term && ! this.state.results.length && ! this.state.searching;
	},

	onSearchChange: function( term ) {
		this.setState( {
			inputValue: term,
			term: term,
			searching: !! term
		} );
	},

	onSearch: function( term ) {
		if ( ! term ) {
			return;
		}
		DocService.search( term, function( err, results ) {
			if ( err ) {
				console.log( err );
			}

			this.setState( {
				results: results,
				searching: false
			} );
		}.bind( this ) );
	},

	results: function() {
		var searchResults;

		if ( this.notFound() ) {
			return <p>Not Found</p>;
		}

		searchResults = this.state.inputValue ? this.state.results : this.state.defaultResults;
		return searchResults.map( function( result ) {
			return (
				<div className="devdocs__result" key={ result.path }>
					<header>
						<h1><a href={ '/devdocs/' + result.path + '?term=' + encodeURIComponent( this.state.term ) }>{ result.title }</a></h1>
						<h2>{ result.path }</h2>
					</header>
					{ this.snippet( result ) }
				</div>
			);
		}, this );
	},

	snippet: function( result ) {
		// split around <mark> tags to avoid setting unescaped inner HTML
		var parts = result.snippet.split(/(<mark>.*?<\/mark>)/);

		return (
			<div className="devdocs__result-snippet" key={ 'snippet' + result.path }>
				{ parts.map( function( part, i ) {
					var markMatch = part.match( /<mark>(.*?)<\/mark>/ );
					if ( markMatch ) {
						return <mark key={ 'mark' + i }>{markMatch[1]}</mark>;
					} else {
						return part;
					}
				} ) }
			</div>
		);
	},

	render: function() {
		var containerClass = classNames( {
			main: true,
			'main-column': true,
			devdocs: true
		} );

		return (
			<div className={ containerClass } role="main">
				<Search
					autoFocus
					placeholder="Search documentation…"
					analyticsGroup="Docs"
					initialValue={ this.state.term }
					delaySearch={ true }
					onSearchChange={ this.onSearchChange }
					onSearch={ this.onSearch }
				/>
				<div className="devdocs__results">
					{ this.results() }
				</div>
			</div>
		);
	}
} );
