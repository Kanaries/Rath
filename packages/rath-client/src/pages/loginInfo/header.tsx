import React, { useState } from 'react';
import { ActionButton, ChoiceGroup, Label, Modal, PrimaryButton } from '@fluentui/react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { getDefaultAvatarURL, AVATAR_IMG_LIST, IAVATAR_TYPES } from '../../utils/user';
import { useGlobalStore } from '../../store';
// enum HeaderList {
//     upload = 'Upload',
//     default = 'Default',
// }

// interface FormListType {
//     key: HeaderList;
//     name: HeaderList;
// }
// const typeList: FormListType[] = [
//     { key: HeaderList.default, name: HeaderList.default },
//     { key: HeaderList.upload, name: HeaderList.upload },
// ];
interface AvatarConfigProps {}

// const ImgUploadDiv = styled.div`
//     height: 100%;
//     width: 800px;
//     .upload-btn {
//         width: 100%;
//         height: 100%;
//         position: relative;
//         box-sizing: border-box;
//         display: block;
//         border: 2px dashed rgba(209, 213, 219);
//         border-radius: 0.5rem;
//         text-align: center;
//     }
//     .upload-btn:hover {
//         border-color: rgba(156, 163, 175);
//     }
//     .add {
//         font-size: 20px;
//         font-weight: 700;
//         color: rgba(107, 114, 128);
//     }
// `;

const DefaultDiv = styled.div`
    width: 800px;
    height: 24rem;
    display: flex;
    flex-wrap: wrap;
    padding: 0.5rem;
    margin: 0.5rem;
    overflow-y: auto;
    .avatar {
        --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
        cursor: pointer;
    }
    .selectAvatar {
        border: 2px solid rgb(244 63 94);
    }
    .selectAvatar:hover {
        border: 2px solid rgb(244 63 94);
    }
    .defaultAvatar {
        border: 2px solid white;
    }
    .defaultAvatar:hover {
        border: 2px solid gray;
    }
`;

const Header: React.FC<AvatarConfigProps> = (props) => {
    const { commonStore } = useGlobalStore();
    const { avatarKey: initAvatarKey, avatarType: initAvatarType, info, avatarUrl } = commonStore;
    // const fileRef = useRef<HTMLInputElement>(null);
    const [show, setShow] = useState<boolean>(false);
    const [avatarKey, setAvatarKey] = useState<string>(initAvatarKey);
    const [avatarType, setAvatarType] = useState<IAVATAR_TYPES>(initAvatarType);
    // const [imgUrl, setImgUrl] = useState('');
    // const [imgFile, setImgFile] = useState<File | null>(null);

    // const createDataset = useCallback(async (e) => {
    //     if (fileRef.current && fileRef.current.files) {
    //         setImgUrl(window.URL.createObjectURL(fileRef.current?.files[0]));
    //     }
    // }, []);

    // const onChangeFileImg = (file: React.SetStateAction<File | null>) => {
    //     setImgFile(file);
    // };
    return (
        <div>
            <Label>{intl.get('login.AvatarImage')}</Label>
            <img
                src={info.avatar || avatarUrl}
                alt="avatar[头像]"
                style={{ width: 150, height: 150, borderRadius: '50%' }}
            />
            <ActionButton
                iconProps={{ iconName: 'EditPhoto' }}
                onClick={() => {
                    setShow(true);
                }}
            >
                Edit
            </ActionButton>
            <Modal
                isOpen={show}
                onDismiss={() => {
                    setShow(false);
                }}
            >
                <div className="p-2">
                    <div className="p-2 m-2">
                        <ChoiceGroup
                            label="Mode"
                            options={[
                                { key: IAVATAR_TYPES.default, text: 'default' },
                                { key: IAVATAR_TYPES.gravatar, text: 'gravatar' },
                            ]}
                            selectedKey={avatarType}
                            onChange={(e, op) => {
                                op && setAvatarType(op.key as IAVATAR_TYPES);
                            }}
                        />
                    </div>
                    {avatarType === IAVATAR_TYPES.default && (
                        <DefaultDiv>
                            {AVATAR_IMG_LIST.map((localAvatarKey) => (
                                <div
                                    className={
                                        'm-2 p-2 avatar ' +
                                        (localAvatarKey === avatarKey ? 'selectAvatar' : 'defaultAvatar')
                                    }
                                    style={{}}
                                    key={localAvatarKey}
                                    onClick={() => {
                                        setAvatarKey(localAvatarKey);
                                    }}
                                >
                                    <img src={getDefaultAvatarURL(localAvatarKey, 'small')} alt=''/>
                                </div>
                            ))}
                        </DefaultDiv>
                    )}
                    {/* 暂不开放 */}
                    {/* {avatarType === IAVATAR_TYPES.gravatar && (
                        <div className="m-2" style={{ height: '24rem' }}>
                            {imgUrl ? (
                                <Corp imgUrl={imgUrl} onChangeFileImg={onChangeFileImg} />
                            ) : (
                                <ImgUploadDiv>
                                    <input
                                        ref={fileRef}
                                        style={{ display: 'none' }}
                                        type="file"
                                        id="input"
                                        onChange={createDataset}
                                    />
                                    <button
                                        className="upload-btn"
                                        onClick={() => {
                                            if (fileRef.current) {
                                                fileRef.current.click();
                                            }
                                        }}
                                    >
                                        <div className="add">
                                            <Icon iconName="Add" />
                                            <div>{intl.get('login.upload')}</div>
                                        </div>
                                    </button>
                                </ImgUploadDiv>
                            )}
                        </div>
                    )} */}
                    <div className="p-2 m-2">
                        <PrimaryButton
                            onClick={() => {
                                if (avatarType === IAVATAR_TYPES.default) {
                                    commonStore.setAvatarConfig(avatarType, avatarKey);
                                }
                                // if (avatarType === IAVATAR_TYPES.gravatar) {
                                //     imgFile && commonStore.customAvatar({ file: imgFile });
                                // }
                                setShow(false);
                            }}
                        >
                            Submit
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Header;
