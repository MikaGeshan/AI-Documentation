import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import CloudDownload from '../../property/images/icons/download';
import StopSquare from '../../property/images/icons/stop';
import LoaderCircle from '../../property/images/icons/loader';

import PdfIcon from '../../property/images/documents/pdf';
import DocsIcon from '../../property/images/documents/docs';
import RotatingLoader from '../Loaders/DownloadLoader';

const CardDocuments = ({
  name,
  lastUpdated,
  mimeType,
  isDownloading,
  onCancel,
}) => {
  const styles = StyleSheet.create({
    buttonContainer: {
      padding: 4,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: '#fff',
      borderRadius: 8,
      elevation: 3,
      width: '100%',
    },

    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    fileIcon: {
      width: 40,
      height: 40,
      marginRight: 12,
    },

    textWrapper: {
      flexShrink: 1,
    },

    name: {
      fontSize: 14,
      fontWeight: '500',
    },

    lastUpdated: {
      marginTop: 2,
      fontSize: 11,
      color: '#888',
    },

    rightSection: {
      marginLeft: 'auto',
      justifyContent: 'center',
      alignItems: 'center',
    },

    actionWrapper: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },

    stopButton: {
      position: 'absolute',
    },
  });

  const FileIcon = mimeType === 'application/pdf' ? PdfIcon : DocsIcon;

  return (
    <TouchableOpacity style={styles.buttonContainer} activeOpacity={0.7}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <View style={styles.fileIcon}>
            <FileIcon width={40} height={40} />
          </View>

          <View style={styles.textWrapper}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.lastUpdated} numberOfLines={1}>
              {new Date(lastUpdated).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.actionWrapper}>
            {!isDownloading && <CloudDownload width={22} height={22} />}

            {isDownloading && (
              <>
                <RotatingLoader>
                  <LoaderCircle width={28} height={28} />
                </RotatingLoader>
                <TouchableOpacity style={styles.stopButton} onPress={onCancel}>
                  <StopSquare width={14} height={14} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CardDocuments;
