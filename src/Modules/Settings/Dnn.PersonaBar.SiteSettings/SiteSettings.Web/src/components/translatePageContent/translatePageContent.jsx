import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import "./style.less";
import resx from "../../resources";
import { Scrollbars } from "react-custom-scrollbars";
import InputGroup from "dnn-input-group";
import Switch from "dnn-switch";
import Label from "dnn-label";
import PersonaBarPageBody from "dnn-persona-bar-page-body";
import TranslationProgressBars from "../languageSettings/TranslationProgressBars";
import Button from "dnn-button";
import TextOverflowWrapper from "dnn-text-overflow-wrapper";
import {
    languages as LanguagesActions,
    siteInfo as SiteInfoActions,
    languageEditor as LanguageEditorActions
} from "actions";
import utils from "utils";


class TranslatePageContent extends Component {
    constructor() {
        super();
        this.state = {
            pageList: [],
            basicSettings: null,
            languageBeingEdited: null
        };
        this.getProgressData = this.getProgressData.bind(this);
    }

    componentWillMount() {
        const {props} = this;
        this.setState({ languageBeingEdited: Object.assign({}, props.languageBeingEdited) });
        this.getPageList();
        this.getBasicSettings();
        this.getProgressData();
    }

    componentWillReceiveProps(props) {
        this.setState({ languageBeingEdited: Object.assign({}, props.languageBeingEdited)  });
    }

    getPageList() {
        const {props} = this;
        const cultureCode = props.languageBeingEdited.Code;
        const portalId = props.portalId;
        props.dispatch(LanguagesActions.getPageList({ cultureCode, portalId }, (data) => {
            this.setState({ pageList: data });
        }));
    }

    getBasicSettings() {
        const {props} = this;
        props.dispatch(SiteInfoActions.getPortalSettings(props.portalId, props.cultureCode, (data) => {
            this.setState({
                basicSettings: Object.assign(data.Settings)
            });
        }));
    }

    getProgressData() {
        const {props} = this;
        props.dispatch(LanguagesActions.getLocalizationProgress((data) => {
            this.setState(data);
            this.getPageList();
            if (data.InProgress && !data.Error) {
                return setTimeout(this.getProgressData, 1000);
            }
            if (data.Error) {
                return;
            }
            this.doneProgress();
        }));
    }

    doneProgress() {
        const {state, props} = this;
        this.getPageList();
        props.dispatch(LanguagesActions.getLanguages(props.portalId, (data) => {
            const languages = data.Languages;
            if (!languages.length) {
                return;
            }
            const language = languages.find(l => l.Code === state.languageBeingEdited.Code);
            this.props.dispatch(LanguageEditorActions.setLanguageBeingEdited(language));
        }));
    }

    renderPageList() {
        const {pageList} = this.state;
        if (!pageList) {
            return;
        }
        return pageList.map((page) => {
            return <div className="page-list-item">
                <span>{page.PageName}</span>
                <a className="float-right" onClick={this.goToPageSettings.bind(this, page.PageId) }>{resx.get("EditPageSettings") }</a>
                <a className="float-right" target="_blank" href={page.ViewUrl}>{resx.get("ViewPage") }</a>
            </div>;
        });
    }

    onMarkAllPagesAsTranslated(cultureCode) {
        const portalId = this.props.portalId;
        this.props.dispatch(LanguagesActions.markAllPagesAsTranslated({ cultureCode, portalId }, () => {
            utils.utilities.notify(resx.get("PagesSuccessfullyTranslated"));
            this.doneProgress();
        }));
    }

    onEraseAllLocalizedPages() {
        const {props} = this;
        const cultureCode = props.languageBeingEdited.Code;
        const portalId = this.props.portalId;
        utils.utilities.confirm(resx.get("EraseTranslatedPagesWarning").replace("{0}", cultureCode), resx.get("Yes"), resx.get("No"), () => {
            props.dispatch(LanguagesActions.deleteLanguagePages({ portalId, cultureCode }, () => {
                utils.utilities.notify(resx.get("DeletedAllLocalizedPages"));
                this.doneProgress();
            }));
        });
    }

    onPublishTranslatedPages(enable = true) {
        const {props} = this;
        const cultureCode = props.languageBeingEdited.Code;
        const portalId = props.portalId;
        props.dispatch(LanguagesActions.publishAllPages({ portalId, cultureCode, enable }, () => {
            const message = enable ? resx.get("PublishedAllTranslatedPages") : resx.get("UnPublishedAllTranslatedPages");
            utils.utilities.notify(message);
            this.doneProgress();
        }));
    }

    addPages() {
        const {props} = this;
        const cultureCode = props.languageBeingEdited.Code;
        const portalId = props.portalId;
        props.dispatch(LanguagesActions.localizeContent({ cultureCode, portalId }, () => {
            this.getProgressData();
        }));
    }

    onCancel() {
        this.props.closePersonaBarPage();
    }

    goToPageSettings(pageId) {
        let personaBar = window.parent.dnn ? window.parent.dnn.PersonaBar : null;
        if (personaBar) {
            personaBar.openPanel("Dnn.Pages",
                {
                    viewParams:
                    {
                        pageId,
                        viewTab: "localization",
                        referral: utils.identifier,
                        referralText: resx.get("BackToLanguages")
                    }
                }
            );

            let event = document.createEvent("Event");
            event.initEvent("viewPageSettings", true, true);

            event.pageId = pageId;
            event.viewTab = "localization";
            event.referral = utils.identifier;
            event.referralText = resx.get("BackToLanguages");

            document.dispatchEvent(event);
        }
    }

    toggleActivateLanguage(languageBeingEdited) {
        this.props.dispatch(LanguagesActions.activateLanguage({
            portalId: this.props.portalId,
            cultureCode: languageBeingEdited.Code,
            enable: languageBeingEdited.Active
        }, () => {
            this.props.dispatch(LanguagesActions.getLanguages(this.props.portalId));
        }));
    }

    onToggleActive(active) {
        if (!active) {
            let {languageBeingEdited} = this.state;
            const languageName = this.props.languageDisplayMode.toLowerCase() === "native" ? languageBeingEdited.NativeName : languageBeingEdited.EnglishName;
            utils.utilities.confirm(resx.get("DeactivateLanguageWarning").replace("{0}", languageName), resx.get("Yes"), resx.get("No"), () => {
                languageBeingEdited.Active = !languageBeingEdited.Active;
                this.toggleActivateLanguage(languageBeingEdited);
                this.setState({ languageBeingEdited });
            });
        } else {
            let {languageBeingEdited} = this.state;
            languageBeingEdited.Active = !languageBeingEdited.Active;
            this.toggleActivateLanguage(languageBeingEdited);
            this.setState({ languageBeingEdited });
        }
    }

    render() {
        const {props, state} = this;
        const language = state.languageBeingEdited;
        const hasPublishedPages = !!language.PublishedPages;
        
        const isEnabled = language.Enabled;
        const pagesNumber = state.pageList ? state.pageList.length : 0;
        const localizablePages = +language.LocalizablePages;
        const TranslatedPages = +language.TranslatedPages;
        
        return <PersonaBarPageBody
            className="translate-page-content"
            backToLinkProps={{
                text: resx.get("BackToLanguages"),
                onClick: props.closePersonaBarPage
            }}>

            <div className="language-settings-page-list">
                {language && <div className="top-block">
                    <div className="language-block">
                        <img className="float-left" src={language.Icon} alt={language.NativeName} />
                        <span >{language.NativeName}</span>
                        {state.basicSettings && <span className="float-right">{state.basicSettings.PortalName}</span>}
                    </div>
                    <InputGroup>
                        <div className="activate-pages-switch">
                            <Label
                                labelType="inline"
                                tooltipMessage={resx.get("ActivatePages.Help") }
                                label={resx.get("ActivatePages") } />
                            <Switch
                                labelHidden={true}
                                value={language.Active}
                                readOnly={!isEnabled}
                                onChange={this.onToggleActive.bind(this) }
                                />
                        </div>
                    </InputGroup>
                    <div className="button-block">
                        <Button
                            type="secondary"
                            disabled={!isEnabled || !localizablePages || !pagesNumber}
                            onClick={this.onMarkAllPagesAsTranslated.bind(this, language.Code) }>
                            <TextOverflowWrapper text={resx.get("MarkAllPagesAsTranslated") } maxWidth={150}/>
                        </Button>
                        <Button
                            disabled={!isEnabled || !localizablePages}
                            type="secondary"
                            onClick={this.onEraseAllLocalizedPages.bind(this) }>
                            <TextOverflowWrapper text={resx.get("EraseAllLocalizedPages") } maxWidth={150}/>
                        </Button>
                        <Button
                            disabled={!language.Active || !isEnabled || !TranslatedPages}
                            type="primary"
                            className="float-right"
                            onClick={this.onPublishTranslatedPages.bind(this, true) }>
                            <TextOverflowWrapper text={resx.get("PublishTranslatedPages") } maxWidth={150}/>
                        </Button>
                        <Button
                            type="secondary"
                            disabled={!language.Active || !isEnabled || !hasPublishedPages || !TranslatedPages}
                            className="float-right"
                            onClick={this.onPublishTranslatedPages.bind(this, false) }>
                            <TextOverflowWrapper text={resx.get("UnpublishTranslatedPages") } maxWidth={150}/>
                        </Button>
                    </div>
                </div>}

                <div className="list-header">
                    <span>{resx.get("PagesToTranslate") } <span>{pagesNumber}</span></span>
                    <span className="float-right" onClick={this.addPages.bind(this) }>
                        <em>+</em>{resx.get("AddAllUnlocalizedPages") }
                    </span>
                </div>

                {state.InProgress && <TranslationProgressBars
                    InProgress={this.state.InProgress}
                    PrimaryPercent={this.state.PrimaryPercent}
                    PrimaryTotal={this.state.PrimaryTotal}
                    PrimaryValue={this.state.PrimaryValue}
                    SecondaryPercent={this.state.SecondaryPercent}
                    SecondaryTotal={this.state.SecondaryTotal}
                    SecondaryValue={this.state.SecondaryValue}
                    TimeEstimated={this.state.TimeEstimated}
                    Error={this.state.Error}
                    CurrentOperationText={this.state.CurrentOperationText}
                    />}
                {!!state.pageList && !!state.pageList.length && <div className="page-list">
                    <Scrollbars className="scrollArea content-vertical"
                        autoHeight
                        autoHeightMin={0}
                        autoHeightMax={500}>
                        {this.renderPageList() }
                    </Scrollbars>
                </div>}
            </div>
        </PersonaBarPageBody>;
    }
}

TranslatePageContent.propTypes = {
    dispatch: PropTypes.func.isRequired,
    pageList: PropTypes.array,
    cultureCode: PropTypes.string,
    onSelectChange: PropTypes.func,
    portalId: PropTypes.number,
    closePersonaBarPage: PropTypes.func,
    languageDisplayMode: PropTypes.string,
    languageBeingEdited: PropTypes.object
};

function mapStateToProps(state) {
    return {
        pageList: state.languages.pageList,
        languageBeingEdited: state.languageEditor.languageBeingEdited,
        languageDisplayMode: (state.languages.languageSettings && state.languages.languageSettings.LanguageDisplayMode) || "NATIVE"
    };
}

export default connect(mapStateToProps)(TranslatePageContent);