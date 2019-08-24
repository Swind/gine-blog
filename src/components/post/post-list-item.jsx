import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardMedia from '@material-ui/core/CardMedia'
import Typography from '@material-ui/core/Typography'
import { Link } from 'gatsby'
import getImageByName from '../utils/notion-hash-image'
import ColorfulTag from '../utils/hash-colorful-tag'
import notion from '../../notion/api'

const styles = {
    card: {
        maxWidth: 800,
        margin: '1em auto',
    },
    media: {
        // ⚠️ object-fit is not supported by IE 11.
        objectFit: 'cover',
    },
}

function ImgMediaCard(props) {
    const { classes, title, content, slug, format, tags, date } = props
    const MyLink = props => <Link to={slug} {...props} />
    return (
        <Card className={classes.card}>
            <CardActionArea component={MyLink}>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                        {title}
                    </Typography>
                    <Typography component="p">
                        {content}
                    </Typography>
                </CardContent>
            </CardActionArea>
            <CardActions>
                <div style={{
                    background: '#eee',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    height: '24px',
                    borderRadius: '3px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    fontSize: '14px',
                    lineHeight: '120%',
                    fontWeight: '400',
                    margin: '0px 6px 6px 0px',
                }}>{date}</div>
                {
                    tags && tags.map(tag => <ColorfulTag tag={tag} key={tag} />)
                }
            </CardActions>
        </Card>
    )
}

ImgMediaCard.propTypes = {
    classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(ImgMediaCard)
