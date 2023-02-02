export interface IDashboardTheme {
    pageBackground: string;
    cardBackground: string;
    outline: string;
    textPrimary: string;
    textNormal: string;
    textSecondary: string;
    fontLarge: string;
    fontNormal: string;
    fontSmall: string;
}

export const themeGold: IDashboardTheme = {
    pageBackground: 'rgb(24,12,4)',
    cardBackground: 'rgb(45,35,24)',
    outline: 'rgb(219, 216, 177)',
    textPrimary: 'rgb(195,191,182)',
    textNormal: 'rgb(188,183,172)',
    textSecondary: 'rgb(127,123,107)',
    fontLarge: '200%',
    fontNormal: '150%',
    fontSmall: '120%',
};
