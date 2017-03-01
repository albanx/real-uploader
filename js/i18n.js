/**
 * @author Alban Xhaferllari
 * Base i18n System For Real Ajax Uploader
 * @file Translator
 */
define(/** @lends Translator */ function () {
    var LOCALE = {
        'en_EN': {
            'Add files': 'Add files',
            'Start upload': 'Start upload',
            'Remove all': 'Remove all',
            'Close': 'Close',
            'Select Files': 'Select Files',
            'Preview': 'Preview',
            'Remove file': 'Remove file',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Upload aborted',
            'Upload all files': 'Upload files',
            'Select Files or Drag&Drop Files': 'Select Files or Drag&Drop Files',
            'File uploaded 100%': 'File uploaded 100%',
            'Max files number reached': 'Max files number reached',
            'Extension not allowed': 'Extension not allowed',
            'File size now allowed': 'File size now allowed'
        },
        'it_IT': {
            'Add files': 'Aggiungi file',
            'Start upload': 'Carica tutto',
            'Remove all': 'Rimuvi tutti',
            'Close': 'Chiudi',
            'Select Files': 'Seleziona',
            'Preview': 'Anteprima',
            'Remove file': 'Rimuovi file',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Interroto',
            'Upload all files': 'Carica tutto',
            'Select Files or Drag&Drop Files': 'Seleziona o Trascina qui i file',
            'File uploaded 100%': 'File caricato 100%',
            'Max files number reached': 'Max files number reached',
            'Extension not allowed': 'Estensione file non permessa',
            'File size now allowed': 'Dimensione file non permessa'
        },
        'sq_AL': {
            'Add files': 'Shto file',
            'Start upload': 'Fillo karikimin',
            'Remove all': 'Hiqi te gjithë',
            'Close': 'Mbyll',
            'Select Files': 'Zgjith filet',
            'Preview': 'Miniaturë',
            'Remove file': 'Hiqe file-in',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Karikimi u ndërpre',
            'Upload all files': 'Kariko të gjithë',
            'Select Files or Drag&Drop Files': 'Zgjith ose Zvarrit dokumentat këtu',
            'File uploaded 100%': 'File u karikua 100%',
            'Max files number reached': 'Maksimumi i fileve u arrit',
            'Extension not allowed': 'Prapashtesa nuk lejohet',
            'File size now allowed': 'Madhësia e filit nuk lejohet'
        },
        'nl_NL': {
            'Add files': 'Bestanden toevoegen',
            'Start upload': 'Start uploaden',
            'Remove all': 'Verwijder alles',
            'Close': 'Sluiten',
            'Select Files': 'Selecteer bestanden',
            'Preview': 'Voorbeeld',
            'Remove file': 'Verwijder bestand',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Upload afgebroken',
            'Upload all files': 'Upload alle bestanden',
            'Select Files or Drag&Drop Files': 'Selecteer bestanden of  Drag&Drop bestanden',
            'File uploaded 100%': 'Bestand geüpload 100%'
        },
        'de_DE': {
            'Add files': 'Dateien hinzufügen',
            'Start upload': 'Hochladen',
            'Remove all': 'Alle entfernen',
            'Close': 'Schliessen',
            'Select Files': 'Dateien wählen',
            'Preview': 'Vorschau',
            'Remove file': 'Datei entfernen',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Upload abgebrochen',
            'Upload all files': 'Alle hochgeladen',
            'Select Files or Drag&Drop Files': 'Wählen Sie Dateien oder fügen Sie sie mit Drag & Drop hinzu.',
            'File uploaded 100%': 'Upload 100%'
        },
        'fr_FR': {
            'Add files': 'Ajouter',
            'Start upload': 'Envoyer',
            'Remove all': 'Tout supprimer',
            'Close': 'Fermer',
            'Select Files': 'Parcourir',
            'Preview': 'Visualiser',
            'Remove file': 'Supprimer fichier',
            'Bytes': 'Bytes',
            'KB': 'Ko',
            'MB': 'Mo',
            'GB': 'Go',
            'Upload aborted': 'Envoi annulé',
            'Upload all files': 'Tout envoyer',
            'Select Files or Drag&Drop Files': 'Parcourir ou Glisser/Déposer',
            'File uploaded 100%': 'Fichier envoyé 100%'
        },
        'es_ES':  {
            'Add files':            'Agregar',
            'Start upload':            'Iniciar',
            'Remove all':            'Quitar todo',
            'Close':                'Cerrar',
            'Select Files':            'Seleccionar',
            'Preview':                'Visualizar',
            'Remove file':            'Eliminar Archivo',
            'Bytes':                'Bytes',
            'KB':                    'KB',
            'MB':                    'MB',
            'GB':                    'GB',
            'Upload aborted':        'Subida cancelada',
            'Upload all files':        'Subir todos',
            'Select Files or Drag&Drop Files':    'Seleccionar o Arrastrar&Soltar Archivos',
            'File uploaded 100%':                'Archivo subido al 100%',
            'Max files number reached':            'Numero max de Archivos alcanzado',
            'Extension not allowed':            'Extension prohibida',
            'File size now allowed':            'Archivo demasiado grande'
        }
    };

    /**
     * A simple singleton for translation
     * @param s string to translate, language on first call of the singleton
     * @returns {*} translated string
     * @constructor
     */
    var Translator = function() {
        var s = arguments[0];
        if ( !Translator.prototype._singletonInstance ) {
            Translator.prototype._singletonInstance = this;
            this.lang = s;
        }else if(s) {
            var me = Translator.prototype._singletonInstance;
            return me.lang && LOCALE[me.lang] !== undefined && LOCALE[me.lang][s] !==undefined ? LOCALE[me.lang][s] : s;
        }
    };
    return Translator;
});