import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import HomeIcon from '@material-ui/icons/Home'
import TagIcon from '@material-ui/icons/Bookmark'
import ArchiveIcon from '@material-ui/icons/Archive'

import { Link } from 'gatsby'

import config from '../../config'


function ListItemLink(props) {
    return <ListItem button component="a" {...props} />
}

const styles = theme => ({
    root: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
    },
    media: {
        height: 200,
    },
})

const MyLink = (props) => {
    return (
        <Link {...props} />
    )
}

function SimpleList(props) {
    let avatar = require(`../static/${config.blogMeta.avatar}`)
    const { classes } = props

    return (
        <div className={classes.root}>
            <List component="nav">
                <MyLink to={'/'}>
                    <ListItem button>
                        <ListItemIcon>
                            <HomeIcon color={'primary'} />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItem>
                </MyLink>

                <MyLink to={'tags'}>
                    <ListItem button>
                        <ListItemIcon>
                            <TagIcon style={{ color: '#673ab7' }} />
                        </ListItemIcon>
                        <ListItemText primary="Tag" />
                    </ListItem>
                </MyLink>

                <MyLink to={'archives'}>
                    <ListItem button>
                        <ListItemIcon>
                            <ArchiveIcon style={{ color: '#f44336' }} />
                        </ListItemIcon>
                        <ListItemText primary="Archive" />
                    </ListItem>
                </MyLink>
            </List>
        </div>
    )
}

SimpleList.propTypes = {
    classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(SimpleList)
