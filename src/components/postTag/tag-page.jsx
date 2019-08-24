import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Badge from '@material-ui/core/Badge'
import withRoot from '../../withRoot'
import Layout from '../layout'
import PostListItem from '../post/post-list-item'
import ColorfulTag from '../utils/hash-colorful-tag'
import { graphql } from 'gatsby'

const styles = theme => ({
    root: {
        textAlign: 'center',
        paddingTop: theme.spacing.unit * 20,
    },
    index: {
        margin: '0 auto',
        maxWidth: 800,
        marginTop: '3em',
    },
})

const StyledBadge = withStyles(theme => ({
    badge: {
        top: '30%',
        right: -10,
        // The border color match the background color.
        border: `2px solid ${
            theme.palette.type === 'light' ? theme.palette.grey[200] : theme.palette.grey[900]
            }`,
    },
}))(Badge);


class Index extends React.Component {
    render() {
        const { classes, data } = this.props
        const { tag } = this.props.pageContext
        return (
            <Layout>
                <div className={classes.index}>
                    <div style={{ display: 'flex' }}>
                        <StyledBadge className={classes.margin} badgeContent={data.allPost.totalCount} color="primary">
                            <ColorfulTag tag={tag} />
                        </StyledBadge>
                    </div>

                    {data.allPost.edges.map(({ node }) => (
                        <PostListItem title={node.name}
                            key={node.id}
                            content={node.brief}
                            slug={node.slug}
                            image={node.image}
                            tags={node.tags}
                            date={node.public_date}
                        />
                    ))}
                </div>
            </Layout>
        )
    }
}

Index.propTypes = {
    classes: PropTypes.object.isRequired,
}

export default withRoot(withStyles(styles)(Index))

export const query = graphql`
query ($tag: String!){
    allPost(filter:{tags: {in: [$tag]}},sort: { fields: [public_date], order: DESC }) {
        edges{
          node{
            id
            name
            tags
            public_date
            slug
            brief
          }
        }
        totalCount
      }
  }
`